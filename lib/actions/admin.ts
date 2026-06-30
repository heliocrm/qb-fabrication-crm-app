"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth/session"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import {
  deactivateOrgUser,
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

export async function inviteOrgUserAction(input: {
  email: string
  fullName: string
  role: OrganizationRole
}) {
  const result = await safeAction(async () => {
    const ctx = await requireAdmin()
    const user = await inviteOrgUser({
      ...input,
      organizationId: ctx.organizationId,
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
