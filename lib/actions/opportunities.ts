"use server"

import { revalidatePath } from "next/cache"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { requireSessionContext } from "@/lib/auth/session"
import {
  createOpportunity,
  getOpportunityById,
  listJobsForOpportunity,
  listOpportunities,
  updateOpportunity,
  updateOpportunityStage,
  type LinkedJobSummary,
} from "@/lib/supabase/services/opportunities"
import { SupabaseServiceError } from "@/lib/supabase/schema"
import { ALL_STAGES, isTerminalStage } from "@/lib/opportunities-config"
import type { Opportunity, OppStage } from "@/types"

function revalidateOpportunityPaths(opportunityId?: string, accountId?: string | null) {
  revalidatePath("/opportunities")
  revalidatePath("/")
  revalidatePath("/customers")
  if (opportunityId) revalidatePath(`/opportunities/${opportunityId}`)
  if (accountId) revalidatePath("/customers")
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

export async function getOpportunityByIdAction(id: string) {
  if (!id?.trim()) return { error: "Opportunity id is required" }
  return safeAction(() => getOpportunityById(id))
}

export async function listJobsForOpportunityAction(opportunityId: string) {
  if (!opportunityId?.trim()) return { error: "Opportunity id is required" }
  return safeAction(() => listJobsForOpportunity(opportunityId)) as Promise<{
    data?: LinkedJobSummary[]
    error?: string
  }>
}

export async function createOpportunityAction(input: {
  title: string
  accountId?: string | null
  value?: number
  stage?: OppStage
  probability?: number
  closeDate?: string | null
  assignee?: string | null
  assigneeId?: string | null
  notes?: string | null
  winLossReason?: string | null
}) {
  if (!input.title?.trim()) {
    return { error: "Title is required" }
  }
  if (input.stage && isTerminalStage(input.stage) && !input.winLossReason?.trim()) {
    return { error: "Win/loss reason is required when stage is Won or Lost" }
  }

  const result = await safeAction(async () => {
    await requireSessionContext()
    return createOpportunity(input)
  })
  if (result.data) revalidateOpportunityPaths(result.data.id, result.data.accountId)
  return result as { data?: Opportunity; error?: string }
}

export async function updateOpportunityAction(
  id: string,
  input: {
    title?: string
    accountId?: string | null
    value?: number
    stage?: OppStage
    probability?: number
    closeDate?: string | null
    assignee?: string | null
    assigneeId?: string | null
    notes?: string | null
    winLossReason?: string | null
  }
) {
  if (!id?.trim()) {
    return { error: "Opportunity id is required" }
  }
  if (input.stage && !ALL_STAGES.includes(input.stage)) {
    return { error: `Invalid stage: ${input.stage}` }
  }
  if (input.stage && isTerminalStage(input.stage) && input.winLossReason !== undefined) {
    if (!input.winLossReason?.trim()) {
      return { error: "Win/loss reason is required when stage is Won or Lost" }
    }
  }

  const result = await safeAction(async () => {
    await requireSessionContext()
    return updateOpportunity(id, input)
  })
  if (result.data) revalidateOpportunityPaths(result.data.id, result.data.accountId)
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
  if (result.data) revalidateOpportunityPaths(result.data.id, result.data.accountId)
  return result as { data?: Opportunity; error?: string }
}
