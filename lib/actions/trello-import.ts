"use server"

import { revalidatePath } from "next/cache"
import { requireManagerOrAdmin } from "@/lib/auth/session"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { SupabaseServiceError } from "@/lib/supabase/schema"
import { isTrelloConfigured } from "@/lib/trello/config"
import {
  commitTrelloImport,
  previewTrelloImport,
  refreshTrelloJobs,
} from "@/lib/trello/import/service"

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

export async function getTrelloStatusAction() {
  return safeAction(async () => {
    await requireManagerOrAdmin()
    return {
      configured: isTrelloConfigured(),
      allowlistSet: Boolean(process.env.TRELLO_BOARD_IDS?.trim()),
    }
  })
}

export async function previewTrelloImportAction() {
  return safeAction(async () => {
    await requireManagerOrAdmin()
    if (!isTrelloConfigured()) {
      throw new Error("Trello is not configured on the server")
    }
    return previewTrelloImport()
  })
}

export async function commitTrelloImportAction(boardIds: string[]) {
  const result = await safeAction(async () => {
    await requireManagerOrAdmin()
    if (!isTrelloConfigured()) {
      throw new Error("Trello is not configured on the server")
    }
    return commitTrelloImport(boardIds)
  })
  if (result.data) {
    revalidatePath("/settings")
    revalidatePath("/jobs")
  }
  return result
}

export async function refreshTrelloJobsAction() {
  const result = await safeAction(async () => {
    await requireManagerOrAdmin()
    if (!isTrelloConfigured()) {
      throw new Error("Trello is not configured on the server")
    }
    return refreshTrelloJobs()
  })
  if (result.data) {
    revalidatePath("/settings")
    revalidatePath("/jobs")
  }
  return result
}
