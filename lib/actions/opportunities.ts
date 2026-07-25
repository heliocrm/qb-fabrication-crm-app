"use server"

import { revalidatePath } from "next/cache"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { requireSessionContext } from "@/lib/auth/session"
import {
  createOpportunity,
  listOpportunities,
  updateOpportunityStage,
} from "@/lib/supabase/services/opportunities"
import { SupabaseServiceError } from "@/lib/supabase/schema"
import { ALL_STAGES } from "@/lib/opportunities-config"
import type { Opportunity, OppStage } from "@/types"

function revalidateOpportunityPaths() {
  revalidatePath("/opportunities")
  revalidatePath("/")
  revalidatePath("/customers")
}

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

export async function fetchOpportunitiesAction() {
  return safeAction(() => listOpportunities())
}

export async function createOpportunityAction(input: {
  title: string
  accountId?: string | null
  value?: number
  stage?: OppStage
  probability?: number
  closeDate?: string | null
  assignee?: string | null
  notes?: string | null
}) {
  if (!input.title?.trim()) {
    return { error: "Title is required" }
  }

  const result = await safeAction(async () => {
    await requireSessionContext()
    return createOpportunity(input)
  })
  if (result.data) revalidateOpportunityPaths()
  return result as { data?: Opportunity; error?: string }
}

export async function updateOpportunityStageAction(id: string, stage: OppStage) {
  if (!id?.trim()) {
    return { error: "Opportunity id is required" }
  }
  if (!ALL_STAGES.includes(stage)) {
    return { error: `Invalid stage: ${stage}` }
  }

  const result = await safeAction(() => updateOpportunityStage(id, stage))
  if (result.data) revalidateOpportunityPaths()
  return result as { data?: Opportunity; error?: string }
}
