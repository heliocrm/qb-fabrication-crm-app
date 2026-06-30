import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
  type TypedSupabaseClient,
} from "@/lib/supabase/schema"
import { mapTaskRow, toTaskInsert } from "@/lib/supabase/mappers"
import { syncJobProgress } from "@/lib/supabase/services/jobs"
import type { Task, TaskInsert, TaskUpdate } from "@/types"

async function getClient(): Promise<TypedSupabaseClient> {
  return createClient()
}

export async function listTasksByJobId(jobId: string): Promise<Task[]> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.tasks)
    .select("*")
    .eq("job_id", jobId)
    .order("sort_order", { ascending: true })

  throwOnError({ data, error })
  return (data ?? []).map(mapTaskRow)
}

export async function listTasksByLineItemId(lineItemId: string): Promise<Task[]> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.tasks)
    .select("*")
    .eq("line_item_id", lineItemId)
    .order("sort_order", { ascending: true })

  throwOnError({ data, error })
  return (data ?? []).map(mapTaskRow)
}

export async function createTask(
  jobId: string,
  lineItemId: string,
  input: Omit<TaskInsert, "organization_id" | "job_id" | "line_item_id">
): Promise<Task> {
  const supabase = await getClient()
  const organizationId = await requireOrganizationId(supabase)

  const payload: TaskInsert = {
    organization_id: organizationId,
    job_id: jobId,
    line_item_id: lineItemId,
    ...input,
  }

  const { data, error } = await supabase
    .from(Tables.tasks)
    .insert(payload)
    .select("*")
    .single()

  const row = throwOnError({ data, error })
  await syncJobProgress(jobId)
  return mapTaskRow(row)
}

export async function createTaskFromDomain(
  jobId: string,
  lineItemId: string,
  task: Pick<Task, "title" | "assignee" | "dueDate" | "category"> &
    Partial<Pick<Task, "completed" | "sortOrder" | "assigneeId">>
): Promise<Task> {
  const supabase = await getClient()
  const organizationId = await requireOrganizationId(supabase)
  const payload = toTaskInsert(task, jobId, lineItemId, organizationId)

  const { data, error } = await supabase
    .from(Tables.tasks)
    .insert(payload)
    .select("*")
    .single()

  const row = throwOnError({ data, error })
  await syncJobProgress(jobId)
  return mapTaskRow(row)
}

export async function updateTask(id: string, updates: TaskUpdate): Promise<Task> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.tasks)
    .update(updates)
    .eq("id", id)
    .select("*")
    .single()

  const row = throwOnError({ data, error })
  await syncJobProgress(row.job_id)
  return mapTaskRow(row)
}

export async function toggleTaskCompleted(id: string, completed: boolean): Promise<Task> {
  return updateTask(id, { completed })
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data: taskRow, error: fetchError } = await supabase
    .from(Tables.tasks)
    .select("job_id")
    .eq("id", id)
    .single()

  const task = throwOnError({ data: taskRow, error: fetchError })

  const { error } = await supabase.from(Tables.tasks).delete().eq("id", id)
  if (error) throwOnError({ data: null, error })

  await syncJobProgress(task.job_id)
}

/** Batch update sort_order after drag-and-drop reorder within a line item */
export async function reorderTasks(
  lineItemId: string,
  orderedTaskIds: string[]
): Promise<Task[]> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const updates = orderedTaskIds.map((taskId, index) =>
    supabase
      .from(Tables.tasks)
      .update({ sort_order: index })
      .eq("id", taskId)
      .eq("line_item_id", lineItemId)
  )

  await Promise.all(updates)
  return listTasksByLineItemId(lineItemId)
}
