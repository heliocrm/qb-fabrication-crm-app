import { createClient } from "@/lib/supabase/server"
import { getTemplateChecklist } from "@/lib/job-templates"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
  type TypedSupabaseClient,
} from "@/lib/supabase/schema"
import { mapLineItemRow, toLineItemInsert } from "@/lib/supabase/mappers"
import type {
  JobTemplateType,
  LineItem,
  LineItemInsert,
  LineItemRow,
  LineItemUpdate,
  TaskInsert,
} from "@/types"

async function getClient(): Promise<TypedSupabaseClient> {
  return createClient()
}

export async function listLineItemsByJobId(jobId: string): Promise<LineItem[]> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.line_items)
    .select("*, tasks ( * )")
    .eq("job_id", jobId)
    .order("sort_order", { ascending: true })

  throwOnError({ data, error })

  return (
    (data ?? []) as unknown as (LineItemRow & { tasks: import("@/types").TaskRow[] })[]
  ).map((row) => mapLineItemRow(row, row.tasks))
}

/** Lightweight line-item WIP summary for Reports filtering */
export async function listLineItemsForReports(): Promise<
  { jobId: string; wipStatus: import("@/types").LineItemWipStatus }[]
> {
  const supabase = await getClient()
  const organizationId = await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.line_items)
    .select("job_id, wip_status")
    .eq("organization_id", organizationId)

  throwOnError({ data, error })

  return (data ?? []).map((row) => ({
    jobId: row.job_id,
    wipStatus: row.wip_status as import("@/types").LineItemWipStatus,
  }))
}

export async function createLineItem(
  jobId: string,
  input: Omit<LineItemInsert, "organization_id" | "job_id">
): Promise<LineItem> {
  const supabase = await getClient()
  const organizationId = await requireOrganizationId(supabase)

  const payload: LineItemInsert = {
    organization_id: organizationId,
    job_id: jobId,
    ...input,
  }

  const { data, error } = await supabase
    .from(Tables.line_items)
    .insert(payload)
    .select("*")
    .single()

  const row = throwOnError({ data, error })
  return mapLineItemRow(row as LineItemRow, [])
}

export async function createLineItemFromDomain(
  jobId: string,
  fields: Pick<LineItem, "title" | "quantity" | "lineItemNumber" | "wipStatus" | "description" | "deliveryDate"> &
    Partial<Pick<LineItem, "sortOrder">>
): Promise<LineItem> {
  const supabase = await getClient()
  const organizationId = await requireOrganizationId(supabase)
  const payload = toLineItemInsert(fields, jobId, organizationId)

  const { data, error } = await supabase
    .from(Tables.line_items)
    .insert(payload)
    .select("*")
    .single()

  const row = throwOnError({ data, error })
  return mapLineItemRow(row as LineItemRow, [])
}

export async function updateLineItem(
  id: string,
  updates: LineItemUpdate
): Promise<LineItem> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.line_items)
    .update(updates)
    .eq("id", id)
    .select("*, tasks ( * )")
    .single()

  const row = throwOnError({ data, error }) as unknown as LineItemRow & {
    tasks: import("@/types").TaskRow[]
  }
  return mapLineItemRow(row, row.tasks)
}

export async function deleteLineItem(id: string): Promise<void> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { error } = await supabase.from(Tables.line_items).delete().eq("id", id)
  if (error) throwOnError({ data: null, error })
}

export async function seedTasksForLineItem(
  jobId: string,
  lineItemId: string,
  template: JobTemplateType,
  organizationId?: string
): Promise<void> {
  const supabase = await getClient()
  const orgId = organizationId ?? (await requireOrganizationId(supabase))
  const checklist = getTemplateChecklist(template)

  const payloads: TaskInsert[] = checklist.map((item, index) => ({
    organization_id: orgId,
    job_id: jobId,
    line_item_id: lineItemId,
    title: item.title,
    category: item.category,
    completed: false,
    sort_order: index,
    assignee: null,
    due_date: null,
  }))

  const { error } = await supabase.from(Tables.tasks).insert(payloads)
  if (error) throwOnError({ data: null, error })
}

export async function createLineItemWithTemplateTasks(
  jobId: string,
  template: JobTemplateType,
  fields: Pick<LineItem, "title" | "quantity" | "lineItemNumber" | "wipStatus" | "description" | "deliveryDate"> &
    Partial<Pick<LineItem, "sortOrder">>
): Promise<LineItem> {
  const lineItem = await createLineItemFromDomain(jobId, fields)
  const supabase = await getClient()
  const organizationId = await requireOrganizationId(supabase)
  await seedTasksForLineItem(jobId, lineItem.id, template, organizationId)
  await import("@/lib/supabase/services/jobs").then((m) => m.syncJobProgress(jobId))

  const { data, error } = await supabase
    .from(Tables.line_items)
    .select("*, tasks ( * )")
    .eq("id", lineItem.id)
    .single()

  const row = throwOnError({ data, error }) as unknown as LineItemRow & {
    tasks: import("@/types").TaskRow[]
  }
  return mapLineItemRow(row, row.tasks)
}
