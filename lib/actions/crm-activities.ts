"use server"

import { revalidatePath } from "next/cache"
import { requireSessionContext } from "@/lib/auth/session"
import {
  createCrmActivity,
  listCrmActivitiesForAccount,
  listCrmActivitiesForJob,
} from "@/lib/supabase/services/crm-activities"
import { SupabaseServiceError } from "@/lib/supabase/schema"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import type { CrmActivityKind } from "@/types"

async function safeAction<T>(fn: () => Promise<T>): Promise<{ data?: T; error?: string }> {
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

export async function listAccountActivitiesAction(accountId: string) {
  return safeAction(async () => {
    await requireSessionContext()
    return listCrmActivitiesForAccount(accountId)
  })
}

export async function listJobCrmActivitiesAction(jobId: string) {
  return safeAction(async () => {
    await requireSessionContext()
    return listCrmActivitiesForJob(jobId)
  })
}

export async function createCrmActivityAction(input: {
  accountId?: string | null
  contactId?: string | null
  jobId?: string | null
  kind?: CrmActivityKind
  body: string
}) {
  if (!input.body?.trim()) {
    return { error: "Note body is required" }
  }

  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    return createCrmActivity({
      ...input,
      createdBy: ctx.profileId,
    })
  })

  if (result.data) {
    revalidatePath("/customers")
    if (input.jobId) revalidatePath(`/jobs/${input.jobId}`)
  }
  return result
}
