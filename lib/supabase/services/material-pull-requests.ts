import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
  type TypedSupabaseClient,
} from "@/lib/supabase/schema"
import { mapMaterialPullRequestRow } from "@/lib/supabase/mappers"
import {
  compareMaterialPullQueueOrder,
  isBorrowReason,
  type MaterialPullChecklist,
} from "@/lib/material-pull-config"
import type {
  CreateMaterialPullInput,
  MaterialPullListFilters,
  MaterialPullRequest,
  MaterialPullRequestUpdate,
  MaterialPullStatus,
  UpdateMaterialPullInput,
} from "@/types"

const MPR_SELECT = `
  *,
  requester:requested_by ( full_name )
` as const

async function getClient(): Promise<TypedSupabaseClient> {
  return createClient()
}

function sortQueue(rows: MaterialPullRequest[]): MaterialPullRequest[] {
  return [...rows].sort(compareMaterialPullQueueOrder)
}

export async function listMaterialPullRequests(
  filters: MaterialPullListFilters = {}
): Promise<MaterialPullRequest[]> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  let query = supabase
    .from(Tables.material_pull_requests)
    .select(MPR_SELECT)
    .order("created_at", { ascending: false })

  if (filters.status === "open") {
    query = query.in("status", ["pending", "approved", "batched"])
  } else if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status)
  }

  if (filters.jobNumber?.trim()) {
    query = query.ilike("job_number", `%${filters.jobNumber.trim()}%`)
  }

  if (filters.batchId) {
    query = query.eq("batch_id", filters.batchId)
  }

  if (filters.neededByBefore) {
    query = query.lte("needed_by", filters.neededByBefore)
  }

  if (filters.neededByAfter) {
    query = query.gte("needed_by", filters.neededByAfter)
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim()
    query = query.or(
      `material.ilike.%${q}%,job_number.ilike.%${q}%,notes.ilike.%${q}%,reason_code.ilike.%${q}%,source_job_number.ilike.%${q}%`
    )
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  throwOnError({ data, error })
  const mapped = (data ?? []).map((row) =>
    mapMaterialPullRequestRow(row as Parameters<typeof mapMaterialPullRequestRow>[0])
  )
  return sortQueue(mapped)
}

export async function getMaterialPullRequestById(
  id: string
): Promise<MaterialPullRequest | null> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.material_pull_requests)
    .select(MPR_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) throwOnError({ data: null, error })
  if (!data) return null
  return mapMaterialPullRequestRow(
    data as Parameters<typeof mapMaterialPullRequestRow>[0]
  )
}

export async function createMaterialPullRequest(
  input: CreateMaterialPullInput,
  requestedBy: string
): Promise<MaterialPullRequest> {
  const supabase = await getClient()
  const organizationId = await requireOrganizationId(supabase)

  if (isBorrowReason(input.reasonCode) && !input.sourceJobNumber?.trim()) {
    throw new Error("Source job # is required when borrowing from another job")
  }

  let jobId = input.jobId ?? null
  if (!jobId && input.jobNumber.trim()) {
    const { data: job } = await supabase
      .from(Tables.jobs)
      .select("id")
      .eq("organization_id", organizationId)
      .ilike("job_number", input.jobNumber.trim())
      .maybeSingle()
    jobId = job?.id ?? null
  }

  const { data, error } = await supabase
    .from(Tables.material_pull_requests)
    .insert({
      organization_id: organizationId,
      job_id: jobId,
      job_number: input.jobNumber.trim(),
      material: input.material.trim(),
      quantity: input.quantity,
      unit: input.unit?.trim() || "ea",
      needed_by: input.neededBy,
      location: input.location?.trim() || null,
      notes: input.notes?.trim() || null,
      priority: input.priority,
      reason_code: input.reasonCode,
      source_job_number: isBorrowReason(input.reasonCode)
        ? input.sourceJobNumber?.trim() || null
        : null,
      status: "pending",
      requested_by: requestedBy,
    })
    .select(MPR_SELECT)
    .single()

  const row = throwOnError({ data, error })
  return mapMaterialPullRequestRow(
    row as Parameters<typeof mapMaterialPullRequestRow>[0]
  )
}

export async function updatePendingMaterialPullRequest(
  id: string,
  input: UpdateMaterialPullInput,
  actorProfileId: string,
  canManage: boolean
): Promise<MaterialPullRequest> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const existing = await getMaterialPullRequestById(id)
  if (!existing) throw new Error("Request not found")
  if (existing.status !== "pending") {
    throw new Error("Only pending requests can be edited")
  }
  if (!canManage && existing.requestedBy !== actorProfileId) {
    throw new Error("You can only edit your own pending requests")
  }

  const reasonCode = input.reasonCode ?? existing.reasonCode
  const sourceJob =
    input.sourceJobNumber !== undefined
      ? input.sourceJobNumber
      : existing.sourceJobNumber

  if (isBorrowReason(reasonCode) && !sourceJob?.trim()) {
    throw new Error("Source job # is required when borrowing from another job")
  }

  const updates: MaterialPullRequestUpdate & { updated_at: string } = {
    updated_at: new Date().toISOString(),
  }

  if (input.jobNumber !== undefined) updates.job_number = input.jobNumber.trim()
  if (input.material !== undefined) updates.material = input.material.trim()
  if (input.quantity !== undefined) updates.quantity = input.quantity
  if (input.unit !== undefined) updates.unit = input.unit.trim() || "ea"
  if (input.neededBy !== undefined) updates.needed_by = input.neededBy
  if (input.location !== undefined) {
    updates.location = input.location?.trim() || null
  }
  if (input.notes !== undefined) updates.notes = input.notes?.trim() || null
  if (input.priority !== undefined) updates.priority = input.priority
  if (input.reasonCode !== undefined) updates.reason_code = input.reasonCode
  updates.source_job_number = isBorrowReason(reasonCode)
    ? sourceJob?.trim() || null
    : null

  const { data, error } = await supabase
    .from(Tables.material_pull_requests)
    .update(updates)
    .eq("id", id)
    .select(MPR_SELECT)
    .single()

  const row = throwOnError({ data, error })
  return mapMaterialPullRequestRow(
    row as Parameters<typeof mapMaterialPullRequestRow>[0]
  )
}

export async function updateMaterialPullStatus(
  id: string,
  status: MaterialPullStatus,
  actorProfileId: string
): Promise<MaterialPullRequest> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const updates: MaterialPullRequestUpdate = {
    status,
  }

  if (status === "approved") {
    updates.approved_by = actorProfileId
  }
  if (status === "pulled") {
    updates.pulled_by = actorProfileId
  }
  if (status === "cancelled") {
    updates.batch_id = null
  }

  const { data, error } = await supabase
    .from(Tables.material_pull_requests)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(MPR_SELECT)
    .single()

  const row = throwOnError({ data, error })
  return mapMaterialPullRequestRow(
    row as Parameters<typeof mapMaterialPullRequestRow>[0]
  )
}

export async function cancelMaterialPullRequest(
  id: string,
  actorProfileId: string,
  isManager: boolean
): Promise<MaterialPullRequest> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const existing = await getMaterialPullRequestById(id)
  if (!existing) {
    throw new Error("Request not found")
  }

  if (!isManager) {
    if (existing.requestedBy !== actorProfileId) {
      throw new Error("You can only cancel your own requests")
    }
    if (existing.status !== "pending") {
      throw new Error("Only pending requests can be cancelled by the requester")
    }
  }

  return updateMaterialPullStatus(id, "cancelled", actorProfileId)
}

export async function assignMaterialPullBatch(
  ids: string[],
  batchId: string | null
): Promise<MaterialPullRequest[]> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  if (ids.length === 0) return []

  if (batchId) {
    const existing = await listMaterialPullRequests({ status: "all" })
    const selected = existing.filter((r) => ids.includes(r.id))
    const notApproved = selected.filter((r) => r.status !== "approved")
    if (notApproved.length > 0) {
      throw new Error(
        "Only approved requests can be batched. Approve first, then create a pull list."
      )
    }
  }

  const updates: MaterialPullRequestUpdate & { updated_at: string } = {
    batch_id: batchId,
    updated_at: new Date().toISOString(),
  }

  if (batchId) {
    updates.status = "batched"
  } else {
    updates.status = "approved"
  }

  const { data, error } = await supabase
    .from(Tables.material_pull_requests)
    .update(updates)
    .in("id", ids)
    .select(MPR_SELECT)

  throwOnError({ data, error })
  return sortQueue(
    (data ?? []).map((row) =>
      mapMaterialPullRequestRow(
        row as Parameters<typeof mapMaterialPullRequestRow>[0]
      )
    )
  )
}

export async function markBatchPulled(
  batchId: string,
  actorProfileId: string,
  completion?: {
    pullNotes?: string | null
    pullChecklist?: MaterialPullChecklist | null
  }
): Promise<MaterialPullRequest[]> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const checklist = completion?.pullChecklist
    ? {
        ...completion.pullChecklist,
        completedAt: new Date().toISOString(),
      }
    : null

  const { data, error } = await supabase
    .from(Tables.material_pull_requests)
    .update({
      status: "pulled",
      pulled_by: actorProfileId,
      pull_notes: completion?.pullNotes?.trim() || null,
      pull_checklist: checklist as MaterialPullRequestUpdate["pull_checklist"],
      updated_at: new Date().toISOString(),
    })
    .eq("batch_id", batchId)
    .neq("status", "cancelled")
    .select(MPR_SELECT)

  throwOnError({ data, error })
  return sortQueue(
    (data ?? []).map((row) =>
      mapMaterialPullRequestRow(
        row as Parameters<typeof mapMaterialPullRequestRow>[0]
      )
    )
  )
}

export async function getMaterialPullSummary(): Promise<{
  pending: number
  approved: number
  batched: number
  pulled: number
  cancelled: number
}> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.material_pull_requests)
    .select("status")

  throwOnError({ data, error })

  const summary = {
    pending: 0,
    approved: 0,
    batched: 0,
    pulled: 0,
    cancelled: 0,
  }

  for (const row of data ?? []) {
    const status = row.status as MaterialPullStatus
    if (status in summary) {
      summary[status] += 1
    }
  }

  return summary
}
