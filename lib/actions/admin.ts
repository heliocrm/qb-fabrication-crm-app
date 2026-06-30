"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth/session"
import { sendInviteEmail } from "@/lib/email/send-invite"
import { isResendConfigured } from "@/lib/email/resend"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import {
  deactivateOrgUser,
  getOrganizationName,
  inviteOrgUser,
  listOrgUsers,
  updateOrgUser,
} from "@/lib/supabase/services/profiles"
import { SupabaseServiceError } from "@/lib/supabase/schema"
import type { OrganizationRole, OrgUser } from "@/types"

async function safeAction<T>(fn: () => Promise<T>): Promise<{ data?: T; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured" }
  }
  try {
    const data = await fn()
    return { data }
  } catch (err) {
    const message =
      err instanceof SupabaseServiceError
        ? err.message
        : err instanceof Error
          ? err.message
          : "An unexpected error occurred"
    return { error: message }
  }
}

export async function fetchOrgUsersAction() {
  return safeAction(async () => {
    await requireAdmin()
    return listOrgUsers()
  })
}

export async function sendInviteAction(input: {
  email: string
  fullName: string
  role: OrganizationRole
}) {
  const result = await safeAction(async () => {
    if (!isResendConfigured()) {
      throw new Error(
        "Email is not configured. Add RESEND_API_KEY to .env.local."
      )
    }

    const ctx = await requireAdmin()
    const organizationName = await getOrganizationName(ctx.organizationId)

    const { user, inviteLink } = await inviteOrgUser({
      ...input,
      organizationId: ctx.organizationId,
    })

    await sendInviteEmail({
      to: input.email,
      fullName: input.fullName,
      inviterName: ctx.fullName,
      organizationName,
      role: input.role,
      inviteLink,
    })

    return user
  })
  if (result.data) revalidatePath("/admin")
  return result
}

export async function updateOrgUserAction(
  profileId: string,
  updates: {
    role?: OrganizationRole
    isActive?: boolean
    fullName?: string
  }
) {
  const result = await safeAction(async () => {
    const ctx = await requireAdmin()
    return updateOrgUser(profileId, updates, ctx.organizationId)
  })
  if (result.data) revalidatePath("/admin")
  return result
}

export async function deactivateOrgUserAction(profileId: string) {
  const result = await safeAction(async () => {
    const ctx = await requireAdmin()
    await deactivateOrgUser(profileId, ctx.organizationId)
    return { profileId }
  })
  if (result.data) revalidatePath("/admin")
  return result
}

export type { OrgUser }
