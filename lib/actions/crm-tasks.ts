"use server"

import { revalidatePath } from "next/cache"
import { requireSessionContext } from "@/lib/auth/session"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { SupabaseServiceError } from "@/lib/supabase/schema"
import {
  completeCrmTask,
  createCrmTask,
  listCrmTasksForAccount,
  uncompleteCrmTask,
} from "@/lib/supabase/services/crm-tasks"
import { listOrgUsersForPicker } from "@/lib/supabase/services/profiles"

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

function revalidateFollowUpPaths(accountId?: string | null) {
  revalidatePath("/customers")
  revalidatePath("/customers/needs-a-touch")
  if (accountId) {
    // Customer 360 is client-loaded; path revalidate still refreshes RSC parents
  }
}

export async function listCrmTasksForAccountAction(
  accountId: string,
  includeCompleted = false
) {
  return safeAction(async () => {
    await requireSessionContext()
    return listCrmTasksForAccount(accountId, { includeCompleted })
  })
}

export async function listFollowUpOwnerOptionsAction() {
  return safeAction(async () => {
    await requireSessionContext()
    return listOrgUsersForPicker()
  })
}

export async function createCrmTaskAction(input: {
  title: string
  body?: string | null
  dueAt?: string | null
  ownerId?: string | null
  accountId?: string | null
  contactId?: string | null
  opportunityId?: string | null
  jobId?: string | null
}) {
  if (!input.title?.trim()) {
    return { error: "Follow-up title is required" }
  }

  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    return createCrmTask({
      title: input.title.trim(),
      body: input.body,
      dueAt: input.dueAt,
      ownerId: input.ownerId?.trim() || ctx.profileId,
      createdBy: ctx.profileId,
      accountId: input.accountId,
      contactId: input.contactId,
      opportunityId: input.opportunityId,
      jobId: input.jobId,
    })
  })

  if (result.data) revalidateFollowUpPaths(input.accountId)
  return result
}

export async function completeCrmTaskAction(id: string) {
  const result = await safeAction(async () => {
    await requireSessionContext()
    return completeCrmTask(id)
  })
  if (result.data) revalidateFollowUpPaths(result.data.accountId)
  return result
}

export async function uncompleteCrmTaskAction(id: string) {
  const result = await safeAction(async () => {
    await requireSessionContext()
    return uncompleteCrmTask(id)
  })
  if (result.data) revalidateFollowUpPaths(result.data.accountId)
  return result
}
