"use server"

import { revalidatePath } from "next/cache"
import { requireSessionContext } from "@/lib/auth/session"
import { createChangeOrder } from "@/lib/supabase/services/change-orders"
import { SupabaseServiceError } from "@/lib/supabase/schema"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import type { ChangeOrderType } from "@/types"

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

export async function createChangeOrderAction(
  jobId: string,
  input: {
    type: ChangeOrderType
    description: string
    impact?: string
    value?: number | null
  }
) {
  const result = await safeAction(async () => {
    await requireSessionContext()
    return createChangeOrder(jobId, input)
  })
  if (result.data) {
    revalidatePath("/jobs")
    revalidatePath(`/jobs/${jobId}`)
  }
  return result
}
