import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getSiteUrl } from "@/lib/supabase/env"
import { Tables, requireOrganizationId, throwOnError } from "@/lib/supabase/schema"
import type { OrganizationRole, OrgUser, ProfileRow, ProfileSummary } from "@/types"

function mapProfileSummary(row: {
  id: string
  full_name: string | null
  role: string
  avatar_initials: string | null
  is_active: boolean
}): ProfileSummary {
  const fullName = row.full_name ?? "Unknown"
  return {
    id: row.id,
    fullName,
    role: row.role as OrganizationRole,
    avatarInitials:
      row.avatar_initials ??
      fullName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    isActive: row.is_active,
  }
}

function initialsFromName(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export async function listOrgUsersForPicker(): Promise<ProfileSummary[]> {
  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.profiles)
    .select("id, full_name, role, avatar_initials, is_active")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("full_name")

  throwOnError({ data, error })
  return (data ?? []).map(mapProfileSummary)
}

export async function listOrgUsers(): Promise<OrgUser[]> {
  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)
  const admin = createAdminClient()

  const { data: profiles, error } = await supabase
    .from(Tables.profiles)
    .select("*")
    .eq("organization_id", organizationId)
    .order("full_name")

  throwOnError({ data: profiles, error })

  const users: OrgUser[] = []
  for (const row of (profiles ?? []) as ProfileRow[]) {
    const { data: authUser } = await admin.auth.admin.getUserById(row.user_id)
    users.push({
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      fullName: row.full_name ?? "Unknown",
      email: authUser.user?.email ?? "",
      role: row.role as OrganizationRole,
      isActive: row.is_active,
      avatarInitials: row.avatar_initials ?? initialsFromName(row.full_name ?? "?"),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })
  }
  return users
}

export async function getOrganizationName(organizationId: string): Promise<string> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from(Tables.organizations)
    .select("name")
    .eq("id", organizationId)
    .single()

  if (error || !data?.name) {
    return "QB Fabrication"
  }
  return data.name
}

export async function inviteOrgUser(input: {
  email: string
  fullName: string
  role: OrganizationRole
  organizationId: string
}): Promise<{ user: OrgUser; inviteLink: string }> {
  const admin = createAdminClient()
  const siteUrl = getSiteUrl()

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "invite",
    email: input.email,
    options: {
      data: { full_name: input.fullName },
      redirectTo: `${siteUrl}/auth/callback?redirectTo=${encodeURIComponent("/")}`,
    },
  })

  if (linkError || !linkData.user) {
    throw new Error(linkError?.message ?? "Failed to create invite")
  }

  const inviteLink = linkData.properties?.action_link
  if (!inviteLink) {
    throw new Error("Failed to generate invite link")
  }

  const userId = linkData.user.id
  const initials = initialsFromName(input.fullName)

  const { data: profile, error: profileError } = await admin
    .from(Tables.profiles)
    .insert({
      user_id: userId,
      organization_id: input.organizationId,
      full_name: input.fullName,
      role: input.role,
      avatar_initials: initials,
      is_active: true,
    })
    .select("*")
    .single()

  throwOnError({ data: profile, error: profileError })

  const row = profile as ProfileRow
  return {
    user: {
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      fullName: row.full_name ?? input.fullName,
      email: input.email,
      role: row.role as OrganizationRole,
      isActive: row.is_active,
      avatarInitials: row.avatar_initials ?? initials,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    inviteLink,
  }
}

async function countAdmins(organizationId: string, excludeProfileId?: string): Promise<number> {
  const admin = createAdminClient()
  let query = admin
    .from(Tables.profiles)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("role", "admin")
    .eq("is_active", true)

  if (excludeProfileId) {
    query = query.neq("id", excludeProfileId)
  }

  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function updateOrgUser(
  profileId: string,
  updates: {
    role?: OrganizationRole
    isActive?: boolean
    fullName?: string
  },
  organizationId: string
): Promise<OrgUser> {
  const supabase = await createClient()

  if (updates.role && updates.role !== "admin") {
    const { data: current } = await supabase
      .from(Tables.profiles)
      .select("role")
      .eq("id", profileId)
      .single()

    if (current?.role === "admin") {
      const remaining = await countAdmins(organizationId, profileId)
      if (remaining === 0) {
        throw new Error("Cannot demote the last active admin")
      }
    }
  }

  if (updates.isActive === false) {
    const { data: current } = await supabase
      .from(Tables.profiles)
      .select("role")
      .eq("id", profileId)
      .single()

    if (current?.role === "admin") {
      const remaining = await countAdmins(organizationId, profileId)
      if (remaining === 0) {
        throw new Error("Cannot deactivate the last active admin")
      }
    }
  }

  const payload: {
    role?: OrganizationRole
    is_active?: boolean
    full_name?: string
    avatar_initials?: string
  } = {}
  if (updates.role !== undefined) payload.role = updates.role
  if (updates.isActive !== undefined) payload.is_active = updates.isActive
  if (updates.fullName !== undefined) {
    payload.full_name = updates.fullName
    payload.avatar_initials = initialsFromName(updates.fullName)
  }

  const { data, error } = await supabase
    .from(Tables.profiles)
    .update(payload)
    .eq("id", profileId)
    .eq("organization_id", organizationId)
    .select("*")
    .single()

  throwOnError({ data, error })
  const row = data as ProfileRow

  const admin = createAdminClient()
  const { data: authUser } = await admin.auth.admin.getUserById(row.user_id)

  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    fullName: row.full_name ?? "Unknown",
    email: authUser.user?.email ?? "",
    role: row.role as OrganizationRole,
    isActive: row.is_active,
    avatarInitials: row.avatar_initials ?? initialsFromName(row.full_name ?? "?"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function deactivateOrgUser(
  profileId: string,
  organizationId: string
): Promise<void> {
  await updateOrgUser(profileId, { isActive: false }, organizationId)
}

export { mapProfileSummary }
