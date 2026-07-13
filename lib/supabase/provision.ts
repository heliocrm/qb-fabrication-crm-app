import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { Tables } from "@/lib/supabase/schema"
import type { UserProfile } from "@/components/user-menu"

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  member: "Member",
  viewer: "Viewer",
}

function formatRoleLabel(role: string | undefined): string {
  if (!role) return "Member"
  return ROLE_LABELS[role] ?? role
}

/**
 * Ensures the signed-in user has a profile linked to QB Fabrication org.
 * Safe to call on every authenticated request (idempotent RPC).
 */
export async function ensureUserProfile(): Promise<void> {
  if (!isSupabaseConfigured()) return

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    await supabase.rpc("provision_user_profile")
  } catch {
    // Non-fatal — UI falls back to mock data
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
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
      .select("full_name, role, avatar_initials, avatar_url, is_active")
      .eq("user_id", user.id)
      .maybeSingle()

    if (profile && profile.is_active === false) return null

    const meta = user.user_metadata ?? {}
    const name =
      profile?.full_name ??
      meta.full_name ??
      meta.name ??
      user.email?.split("@")[0] ??
      "User"

    const initials =
      profile?.avatar_initials ??
      name
        .split(" ")
        .map((part: string) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()

    return {
      name,
      email: user.email,
      role: formatRoleLabel(profile?.role ?? meta.role),
      initials,
      avatarUrl: profile?.avatar_url ?? null,
      organizationRole: profile?.role,
    }
  } catch {
    return null
  }
}
