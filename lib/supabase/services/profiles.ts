import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getSiteUrl } from "@/lib/supabase/env"
import { Tables, requireOrganizationId, throwOnError } from "@/lib/supabase/schema"
import type { OrganizationRole, OrgUser, ProfileRow, ProfileSummary, OwnProfile, NotificationPreferences, JobListItem } from "@/types"
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/types/Profile"
import { mapJobListItem } from "@/lib/supabase/mappers"
import { JOB_LIST_SELECT } from "@/lib/supabase/schema"

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

async function getOrgProfileAuthUser(
  profileId: string,
  organizationId: string
): Promise<{ userId: string; email: string; fullName: string }> {
  const admin = createAdminClient()
  const { data: profile, error } = await admin
    .from(Tables.profiles)
    .select("user_id, full_name")
    .eq("id", profileId)
    .eq("organization_id", organizationId)
    .single()

  if (error || !profile) {
    throw new Error("User not found in this organization")
  }

  const { data: authData, error: authError } = await admin.auth.admin.getUserById(
    profile.user_id
  )
  if (authError || !authData.user?.email) {
    throw new Error(authError?.message ?? "Could not load auth user email")
  }

  return {
    userId: profile.user_id,
    email: authData.user.email,
    fullName: profile.full_name ?? "User",
  }
}

export async function setOrgUserPassword(
  profileId: string,
  password: string,
  organizationId: string
): Promise<void> {
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.")
  }

  const { userId } = await getOrgProfileAuthUser(profileId, organizationId)
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(userId, { password })
  if (error) throw new Error(error.message)
}

export async function createOrgUserPasswordResetLink(
  profileId: string,
  organizationId: string
): Promise<{ email: string; fullName: string; resetLink: string }> {
  const { email, fullName } = await getOrgProfileAuthUser(profileId, organizationId)
  const admin = createAdminClient()
  const siteUrl = getSiteUrl()

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${siteUrl}/auth/callback?redirectTo=${encodeURIComponent("/auth/reset-password")}`,
    },
  })

  if (error) throw new Error(error.message)

  const resetLink = data.properties?.action_link
  if (!resetLink) {
    throw new Error("Failed to generate password reset link")
  }

  return { email, fullName, resetLink }
}

function parseNotificationPreferences(raw: unknown): NotificationPreferences {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_NOTIFICATION_PREFERENCES }
  const obj = raw as Record<string, unknown>
  return {
    job_updates_email:
      typeof obj.job_updates_email === "boolean"
        ? obj.job_updates_email
        : DEFAULT_NOTIFICATION_PREFERENCES.job_updates_email,
    task_assignments_email:
      typeof obj.task_assignments_email === "boolean"
        ? obj.task_assignments_email
        : DEFAULT_NOTIFICATION_PREFERENCES.task_assignments_email,
    material_request_push:
      typeof obj.material_request_push === "boolean"
        ? obj.material_request_push
        : DEFAULT_NOTIFICATION_PREFERENCES.material_request_push,
    material_request_email:
      typeof obj.material_request_email === "boolean"
        ? obj.material_request_email
        : DEFAULT_NOTIFICATION_PREFERENCES.material_request_email,
  }
}

export async function getOwnProfile(): Promise<OwnProfile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from(Tables.profiles)
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error || !data || !data.is_active) return null

  const row = data as ProfileRow
  const fullName = row.full_name ?? user.email?.split("@")[0] ?? "User"

  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    fullName,
    email: user.email ?? "",
    role: row.role as OrganizationRole,
    avatarInitials: row.avatar_initials ?? initialsFromName(fullName),
    avatarUrl: row.avatar_url ?? null,
    notificationPreferences: parseNotificationPreferences(row.notification_preferences),
  }
}

export async function updateOwnProfile(updates: {
  fullName?: string
  avatarInitials?: string
  avatarUrl?: string | null
}): Promise<OwnProfile> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const payload: {
    full_name?: string
    avatar_initials?: string
    avatar_url?: string | null
  } = {}

  if (updates.fullName !== undefined) {
    payload.full_name = updates.fullName
    payload.avatar_initials =
      updates.avatarInitials ?? initialsFromName(updates.fullName)
  } else if (updates.avatarInitials !== undefined) {
    payload.avatar_initials = updates.avatarInitials
  }

  if (updates.avatarUrl !== undefined) {
    payload.avatar_url = updates.avatarUrl
  }

  const { data, error } = await supabase
    .from(Tables.profiles)
    .update(payload)
    .eq("user_id", user.id)
    .select("*")
    .single()

  throwOnError({ data, error })

  const profile = await getOwnProfile()
  if (!profile) throw new Error("Profile not found after update")
  return profile
}

export async function updateNotificationPreferences(
  prefs: NotificationPreferences
): Promise<OwnProfile> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from(Tables.profiles)
    .update({ notification_preferences: prefs as unknown as import("@/types").Json })
    .eq("user_id", user.id)
    .select("*")
    .single()

  throwOnError({ data, error })

  const profile = await getOwnProfile()
  if (!profile) throw new Error("Profile not found after update")
  return profile
}

type AssignedJobRow = Parameters<typeof mapJobListItem>[0]

export async function listJobsAssignedToProfile(
  profileId: string
): Promise<JobListItem[]> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const { data: assignments, error: assignError } = await supabase
    .from(Tables.job_assignees)
    .select("job_id")
    .eq("profile_id", profileId)

  throwOnError({ data: assignments, error: assignError })

  const jobIds = (assignments ?? []).map((a) => a.job_id)
  if (jobIds.length === 0) return []

  const { data, error } = await supabase
    .from(Tables.jobs)
    .select(JOB_LIST_SELECT)
    .in("id", jobIds)
    .order("delivery_date", { ascending: true, nullsFirst: false })

  throwOnError({ data, error })

  return ((data ?? []) as unknown as AssignedJobRow[]).map(mapJobListItem)
}

export { mapProfileSummary }
