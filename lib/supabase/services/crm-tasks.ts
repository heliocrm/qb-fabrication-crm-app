import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
} from "@/lib/supabase/schema"
import { resolveAccountId, resolveJobId } from "@/lib/seed-ids"
import type { CrmTask, CrmTaskRow } from "@/types"

type TaskListRow = CrmTaskRow & {
  owner?: { full_name: string | null } | null
}

function mapTaskRow(row: TaskListRow): CrmTask {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    body: row.body ?? "",
    dueAt: row.due_at,
    completedAt: row.completed_at,
    ownerId: row.owner_id,
    ownerName: row.owner?.full_name ?? null,
    createdBy: row.created_by,
    accountId: row.account_id,
    contactId: row.contact_id,
    opportunityId: row.opportunity_id,
    jobId: row.job_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const TASK_SELECT = `
  *,
  owner:owner_id ( full_name )
` as const

export async function listCrmTasksForAccount(
  accountId: string,
  options?: { includeCompleted?: boolean }
): Promise<CrmTask[]> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)
  const resolved = resolveAccountId(accountId)

  let query = supabase
    .from(Tables.crm_tasks)
    .select(TASK_SELECT)
    .eq("account_id", resolved)
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100)

  if (!options?.includeCompleted) {
    query = query.is("completed_at", null)
  }

  const { data, error } = await query
  throwOnError({ data, error })
  return ((data ?? []) as unknown as TaskListRow[]).map(mapTaskRow)
}

export async function listOpenCrmTasksForOwner(
  ownerId: string
): Promise<CrmTask[]> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.crm_tasks)
    .select(TASK_SELECT)
    .eq("owner_id", ownerId)
    .is("completed_at", null)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(100)

  throwOnError({ data, error })
  return ((data ?? []) as unknown as TaskListRow[]).map(mapTaskRow)
}

export async function createCrmTask(input: {
  title: string
  body?: string | null
  dueAt?: string | null
  ownerId: string
  createdBy: string
  accountId?: string | null
  contactId?: string | null
  opportunityId?: string | null
  jobId?: string | null
}): Promise<CrmTask> {
  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)

  const accountId = input.accountId
    ? resolveAccountId(input.accountId)
    : null
  const jobId = input.jobId ? resolveJobId(input.jobId) : null

  if (!accountId && !input.contactId && !input.opportunityId && !jobId) {
    throw new Error(
      "Follow-up must link to an account, contact, opportunity, or job"
    )
  }

  const { data, error } = await supabase
    .from(Tables.crm_tasks)
    .insert({
      organization_id: organizationId,
      title: input.title.trim(),
      body: input.body?.trim() || null,
      due_at: input.dueAt || null,
      owner_id: input.ownerId,
      created_by: input.createdBy,
      account_id: accountId,
      contact_id: input.contactId ?? null,
      opportunity_id: input.opportunityId ?? null,
      job_id: jobId,
    })
    .select(TASK_SELECT)
    .single()

  const row = throwOnError({ data, error }) as unknown as TaskListRow
  return mapTaskRow(row)
}

export async function completeCrmTask(id: string): Promise<CrmTask> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.crm_tasks)
    .update({ completed_at: new Date().toISOString() })
    .eq("id", id)
    .select(TASK_SELECT)
    .single()

  const row = throwOnError({ data, error }) as unknown as TaskListRow
  return mapTaskRow(row)
}

export async function uncompleteCrmTask(id: string): Promise<CrmTask> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.crm_tasks)
    .update({ completed_at: null })
    .eq("id", id)
    .select(TASK_SELECT)
    .single()

  const row = throwOnError({ data, error }) as unknown as TaskListRow
  return mapTaskRow(row)
}

export async function updateCrmTask(
  id: string,
  input: {
    title?: string
    body?: string | null
    dueAt?: string | null
    ownerId?: string
  }
): Promise<CrmTask> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const updates: {
    title?: string
    body?: string | null
    due_at?: string | null
    owner_id?: string
  } = {}
  if (input.title !== undefined) updates.title = input.title.trim()
  if (input.body !== undefined) updates.body = input.body?.trim() || null
  if (input.dueAt !== undefined) updates.due_at = input.dueAt || null
  if (input.ownerId !== undefined) updates.owner_id = input.ownerId

  const { data, error } = await supabase
    .from(Tables.crm_tasks)
    .update(updates)
    .eq("id", id)
    .select(TASK_SELECT)
    .single()

  const row = throwOnError({ data, error }) as unknown as TaskListRow
  return mapTaskRow(row)
}
