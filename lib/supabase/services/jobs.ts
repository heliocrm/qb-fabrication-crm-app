import { createClient } from "@/lib/supabase/server"
import {
  JOB_LIST_SELECT,
  JOB_WITH_RELATIONS_SELECT,
  Tables,
  requireOrganizationId,
  throwOnError,
  type TypedSupabaseClient,
} from "@/lib/supabase/schema"
import {
  mapJobListItem,
  mapJobRow,
  toJobInsert,
} from "@/lib/supabase/mappers"
import type { Job, JobInsert, JobListFilters, JobListItem, JobUpdate, JobWithRelations, JobRow, TaskRow, DocumentRow, ChangeOrderRow, ActivityRow } from "@/types"

type JobListRow = JobRow & {
  accounts: { id: string; name: string; short_name: string } | null
}

type JobDetailRow = JobRow & {
  accounts: { id: string; name: string; short_name: string } | null
  tasks: TaskRow[]
  documents: DocumentRow[]
  change_orders: ChangeOrderRow[]
  activity_logs: ActivityRow[]
}

async function getClient(): Promise<TypedSupabaseClient> {
  return createClient()
}

/**
 * Fetch a single job with tasks, documents, change orders, and activity.
 */
export async function getJobById(id: string): Promise<JobWithRelations | null> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.jobs)
    .select(JOB_WITH_RELATIONS_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) throwOnError({ data: null, error })
  if (!data) return null

  return mapJobRow(data as unknown as JobDetailRow)
}

/**
 * List jobs with optional filters. Joins account for customer name.
 */
export async function listJobs(filters: JobListFilters = {}): Promise<JobListItem[]> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  let query = supabase
    .from(Tables.jobs)
    .select(JOB_LIST_SELECT)
    .order("delivery_date", { ascending: true, nullsFirst: false })

  if (filters.accountId || filters.customerId) {
    query = query.eq("account_id", filters.accountId ?? filters.customerId!)
  }
  if (filters.status) {
    query = query.eq("status", filters.status)
  }
  if (filters.priority) {
    query = query.eq("priority", filters.priority)
  }
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`
    query = query.or(
      `job_number.ilike.${term},po_number.ilike.${term},description.ilike.${term}`
    )
  }
  if (filters.limit) {
    query = query.limit(filters.limit)
  }
  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1)
  }

  const { data, error } = await query
  throwOnError({ data, error })

  return ((data ?? []) as unknown as JobListRow[]).map(mapJobListItem)
}

export async function createJob(
  input: Omit<JobInsert, "organization_id"> & { organization_id?: string }
): Promise<JobWithRelations> {
  const supabase = await getClient()
  const organizationId = input.organization_id ?? (await requireOrganizationId(supabase))

  const payload: JobInsert = {
    ...input,
    organization_id: organizationId,
  }

  const { data, error } = await supabase
    .from(Tables.jobs)
    .insert(payload)
    .select(JOB_WITH_RELATIONS_SELECT)
    .single()

  throwOnError({ data, error })
  return mapJobRow(data as unknown as JobDetailRow)
}

export async function createJobFromDomain(
  partial: Partial<Job> & { jobNumber: string; poNumber: string; description: string }
): Promise<JobWithRelations> {
  const supabase = await getClient()
  const organizationId = await requireOrganizationId(supabase)
  const payload = toJobInsert(partial, organizationId)

  const { data, error } = await supabase
    .from(Tables.jobs)
    .insert(payload)
    .select(JOB_WITH_RELATIONS_SELECT)
    .single()

  throwOnError({ data, error })
  return mapJobRow(data as unknown as JobDetailRow)
}

export async function updateJob(id: string, updates: JobUpdate): Promise<JobWithRelations> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.jobs)
    .update(updates)
    .eq("id", id)
    .select(JOB_WITH_RELATIONS_SELECT)
    .single()

  throwOnError({ data, error })
  return mapJobRow(data as unknown as JobDetailRow)
}

export async function deleteJob(id: string): Promise<void> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { error } = await supabase.from(Tables.jobs).delete().eq("id", id)
  if (error) throwOnError({ data: null, error })
}

/** Recalculate job progress from completed tasks */
export async function syncJobProgress(jobId: string): Promise<number> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data: tasks, error: tasksError } = await supabase
    .from(Tables.tasks)
    .select("completed")
    .eq("job_id", jobId)

  throwOnError({ data: tasks, error: tasksError })

  const total = tasks?.length ?? 0
  const completed = tasks?.filter((t) => t.completed).length ?? 0
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  await updateJob(jobId, { progress })
  return progress
}
