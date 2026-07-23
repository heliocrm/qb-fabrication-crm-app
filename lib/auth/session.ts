import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { Tables } from "@/lib/supabase/schema"
import { ensureUserProfile } from "@/lib/supabase/provision"
import {
  canManageAssignees,
  isAdminRole,
} from "@/lib/auth/permissions"
import type { OrganizationRole } from "@/types"

export {
  canWriteJobs,
  canManageAssignees,
  canCreateJobs,
  isAdminRole,
  canCreateMaterialRequests,
  canManageMaterialRequests,
  canViewMaterialRequests,
} from "@/lib/auth/permissions"

export interface SessionContext {
  profileId: string
  userId: string
  organizationId: string
  role: OrganizationRole
  isActive: boolean
  fullName: string
  email: string | undefined
}

export async function getSessionContext(): Promise<SessionContext | null> {
  if (!isSupabaseConfigured()) return null

  try {
    await ensureUserProfile()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
      .from(Tables.profiles)
      .select("id, organization_id, full_name, role, is_active, avatar_initials")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!profile || !profile.is_active) return null

    return {
      profileId: profile.id,
      userId: user.id,
      organizationId: profile.organization_id,
      role: profile.role as OrganizationRole,
      isActive: profile.is_active,
      fullName: profile.full_name ?? user.email?.split("@")[0] ?? "User",
      email: user.email,
    }
  } catch {
    return null
  }
}

export async function requireSessionContext(): Promise<SessionContext> {
  const ctx = await getSessionContext()
  if (!ctx) {
    throw new Error("Not authenticated or account deactivated")
  }
  return ctx
}

export async function requireAdmin(): Promise<SessionContext> {
  const ctx = await requireSessionContext()
  if (!isAdminRole(ctx.role)) {
    throw new Error("Admin access required")
  }
  return ctx
}

export async function requireManagerOrAdmin(): Promise<SessionContext> {
  const ctx = await requireSessionContext()
  if (!canManageAssignees(ctx.role)) {
    throw new Error("Manager or admin access required")
  }
  return ctx
}
