"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth/session"
import { sendInviteEmail } from "@/lib/email/send-invite"
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset"
import { isResendConfigured } from "@/lib/email/resend"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import {
  createOrgUserPasswordResetLink,
  deactivateOrgUser,
  getOrganizationName,
  inviteOrgUser,
  listOrgUsers,
  setOrgUserPassword,
  updateOrgUser,
} from "@/lib/supabase/services/profiles"
import { SupabaseServiceError } from "@/lib/supabase/schema"
import type { OrganizationRole } from "@/types"

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
    console.error("[admin] action failed:", message, err)
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
        "Email is not configured. Add RESEND_API_KEY to .env.local (or Vercel env) and restart the dev server."
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

export async function setOrgUserPasswordAction(profileId: string, password: string) {
  return safeAction(async () => {
    const ctx = await requireAdmin()
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.")
    }
    await setOrgUserPassword(profileId, password, ctx.organizationId)
    return { profileId }
  })
}

export async function sendOrgUserPasswordResetAction(profileId: string) {
  return safeAction(async () => {
    if (!isResendConfigured()) {
      throw new Error(
        "Email is not configured. Add RESEND_API_KEY to .env.local (or Vercel env) and restart the dev server."
      )
    }

    const ctx = await requireAdmin()
    const organizationName = await getOrganizationName(ctx.organizationId)
    const { email, fullName, resetLink } = await createOrgUserPasswordResetLink(
      profileId,
      ctx.organizationId
    )

    await sendPasswordResetEmail({
      to: email,
      fullName,
      organizationName,
      resetLink,
      requestedByName: ctx.fullName,
    })

    return { profileId, email }
  })
}
