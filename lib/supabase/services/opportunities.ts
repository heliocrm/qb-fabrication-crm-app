import { createClient } from "@/lib/supabase/server"
import {
  OPPORTUNITY_LIST_SELECT,
  Tables,
  requireOrganizationId,
  SupabaseServiceError,
  throwOnError,
  type TypedSupabaseClient,
} from "@/lib/supabase/schema"
import { mapOpportunityRow } from "@/lib/supabase/mappers"
import { ALL_STAGES, isTerminalStage } from "@/lib/opportunities-config"
import type {
  Opportunity,
  OpportunityInsert,
  OpportunityRow,
  OpportunityUpdate,
  OppStage,
} from "@/types"

type OpportunityListRow = OpportunityRow & {
  accounts: { id: string; name: string; short_name: string } | null
}

export type LinkedJobSummary = {
  id: string
  jobNumber: string
  description: string
  status: string
}

async function getClient(): Promise<TypedSupabaseClient> {
  return createClient()
}

function probabilityForStage(stage: OppStage, current: number): number {
  if (stage === "Won") return 100
  if (stage === "Lost") return 0
  return current
}

/** List opportunities with account relation for customer name */
export async function listOpportunities(): Promise<Opportunity[]> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.opportunities)
    .select(OPPORTUNITY_LIST_SELECT)
    .order("close_date", { ascending: true, nullsFirst: false })

  throwOnError({ data, error })

  return ((data ?? []) as unknown as OpportunityListRow[]).map(mapOpportunityRow)
}

export async function getOpportunityById(id: string): Promise<Opportunity | null> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.opportunities)
    .select(OPPORTUNITY_LIST_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new SupabaseServiceError(error.message, error.code, error.details)
  }
  if (!data) return null
  return mapOpportunityRow(data as unknown as OpportunityListRow)
}

export async function listJobsForOpportunity(
  opportunityId: string
): Promise<LinkedJobSummary[]> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.jobs)
    .select("id, job_number, description, status")
    .eq("opportunity_id", opportunityId)
    .order("created_at", { ascending: false })

  throwOnError({ data, error })

  return (data ?? []).map((row) => ({
    id: row.id,
    jobNumber: row.job_number,
    description: row.description,
    status: row.status,
  }))
}

export async function createOpportunity(input: {
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
}): Promise<Opportunity> {
  const supabase = await getClient()
  const organizationId = await requireOrganizationId(supabase)

  const stage = input.stage ?? "Prospecting"
  if (!ALL_STAGES.includes(stage)) {
    throw new Error(`Invalid stage: ${stage}`)
  }

  if (isTerminalStage(stage) && !input.winLossReason?.trim()) {
    throw new Error("Win/loss reason is required when stage is Won or Lost")
  }

  const probability =
    stage === "Won" ? 100 : stage === "Lost" ? 0 : (input.probability ?? 10)

  const payload: OpportunityInsert = {
    organization_id: organizationId,
    account_id: input.accountId ?? null,
    title: input.title.trim(),
    value: input.value ?? 0,
    stage,
    probability,
    close_date: input.closeDate || null,
    assignee: input.assignee?.trim() || null,
    assignee_id: input.assigneeId ?? null,
    notes: input.notes?.trim() || null,
    win_loss_reason: isTerminalStage(stage)
      ? input.winLossReason?.trim() || null
      : null,
  }

  const { data, error } = await supabase
    .from(Tables.opportunities)
    .insert(payload)
    .select(OPPORTUNITY_LIST_SELECT)
    .single()

  throwOnError({ data, error })
  return mapOpportunityRow(data as unknown as OpportunityListRow)
}

export async function updateOpportunity(
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
): Promise<Opportunity> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data: existing, error: fetchError } = await supabase
    .from(Tables.opportunities)
    .select("stage, probability, win_loss_reason")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    throw new SupabaseServiceError(fetchError.message, fetchError.code, fetchError.details)
  }
  if (!existing) {
    throw new Error("Opportunity not found")
  }

  const stage = input.stage ?? (existing.stage as OppStage)
  if (!ALL_STAGES.includes(stage)) {
    throw new Error(`Invalid stage: ${stage}`)
  }

  const winLossReason =
    input.winLossReason !== undefined
      ? input.winLossReason?.trim() || null
      : existing.win_loss_reason

  if (isTerminalStage(stage) && !winLossReason) {
    throw new Error("Win/loss reason is required when stage is Won or Lost")
  }

  const updates: OpportunityUpdate = {
    stage,
    probability: probabilityForStage(
      stage,
      input.probability ?? existing.probability
    ),
    win_loss_reason: isTerminalStage(stage) ? winLossReason : null,
  }

  if (input.title !== undefined) updates.title = input.title.trim()
  if (input.accountId !== undefined) updates.account_id = input.accountId
  if (input.value !== undefined) updates.value = input.value
  if (input.closeDate !== undefined) updates.close_date = input.closeDate || null
  if (input.assignee !== undefined) updates.assignee = input.assignee?.trim() || null
  if (input.assigneeId !== undefined) updates.assignee_id = input.assigneeId
  if (input.notes !== undefined) updates.notes = input.notes?.trim() || null
  if (input.probability !== undefined && !isTerminalStage(stage)) {
    updates.probability = input.probability
  }

  const { data, error } = await supabase
    .from(Tables.opportunities)
    .update(updates)
    .eq("id", id)
    .select(OPPORTUNITY_LIST_SELECT)
    .single()

  throwOnError({ data, error })
  return mapOpportunityRow(data as unknown as OpportunityListRow)
}

/** Update pipeline stage; adjusts probability for Won/Lost */
export async function updateOpportunityStage(
  id: string,
  stage: OppStage
): Promise<Opportunity> {
  if (!ALL_STAGES.includes(stage)) {
    throw new Error(`Invalid stage: ${stage}`)
  }

  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data: existing, error: fetchError } = await supabase
    .from(Tables.opportunities)
    .select("probability, win_loss_reason")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    throw new SupabaseServiceError(fetchError.message, fetchError.code, fetchError.details)
  }
  if (!existing) {
    throw new Error("Opportunity not found")
  }

  const probability = probabilityForStage(stage, existing.probability)
  const updates: {
    stage: OppStage
    probability: number
    win_loss_reason?: string | null
  } = { stage, probability }

  // Clearing terminal outcome when moved back to active pipeline
  if (!isTerminalStage(stage)) {
    updates.win_loss_reason = null
  }

  const { data, error } = await supabase
    .from(Tables.opportunities)
    .update(updates)
    .eq("id", id)
    .select(OPPORTUNITY_LIST_SELECT)
    .single()

  throwOnError({ data, error })
  return mapOpportunityRow(data as unknown as OpportunityListRow)
}
