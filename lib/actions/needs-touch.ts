"use server"

import { revalidatePath } from "next/cache"
import {
  canManageAssignees,
  requireSessionContext,
} from "@/lib/auth/session"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { SupabaseServiceError } from "@/lib/supabase/schema"
import { listNeedsTouchContacts } from "@/lib/supabase/services/needs-touch"
import { updateContact } from "@/lib/supabase/services/contacts"
import { createCrmActivity } from "@/lib/supabase/services/crm-activities"

async function safeAction<T>(
  fn: () => Promise<T>
): Promise<{ data?: T; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured" }
  }
  try {
    return { data: await fn() }
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

export async function listNeedsTouchAction(scope: "mine" | "all" = "mine") {
  return safeAction(async () => {
    const ctx = await requireSessionContext()
    const effectiveScope =
      scope === "all" && canManageAssignees(ctx.role) ? "all" : "mine"
    const rows = await listNeedsTouchContacts({
      profileId: ctx.profileId,
      scope: effectiveScope,
    })
    return {
      rows,
      scope: effectiveScope,
      canViewAll: canManageAssignees(ctx.role),
      profileId: ctx.profileId,
    }
  })
}

export async function logTouchFromQueueAction(input: {
  contactId: string
  accountId: string
  body: string
}) {
  if (!input.body?.trim()) {
    return { error: "Note body is required" }
  }
  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    return createCrmActivity({
      contactId: input.contactId,
      accountId: input.accountId,
      kind: "touch",
      body: input.body.trim(),
      createdBy: ctx.profileId,
    })
  })
  if (result.data) {
    revalidatePath("/customers/needs-a-touch")
    revalidatePath("/customers")
  }
  return result
}

export async function setNextTouchFromQueueAction(input: {
  contactId: string
  nextTouchAt: string | null
}) {
  const result = await safeAction(async () => {
    await requireSessionContext()
    return updateContact(input.contactId, {
      nextTouchAt: input.nextTouchAt,
    })
  })
  if (result.data) {
    revalidatePath("/customers/needs-a-touch")
    revalidatePath("/customers")
  }
  return result
}
