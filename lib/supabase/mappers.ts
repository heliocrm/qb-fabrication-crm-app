import { normalizeCustomerId } from "@/lib/seed-ids"
import type {
  Account,
  AccountRow,
  Activity,
  ActivityRow,
  ChangeOrder,
  ChangeOrderRow,
  Document,
  DocumentRow,
  Job,
  JobInsert,
  JobListItem,
  JobRow,
  LineItem,
  LineItemInsert,
  LineItemRow,
  Opportunity,
  OpportunityRow,
  Task,
  TaskInsert,
  TaskRow,
} from "@/types"

type JobWithAccount = JobRow & {
  accounts: { id: string; name: string; short_name: string } | null
}

type OpportunityWithAccount = OpportunityRow & {
  accounts: { id: string; name: string; short_name: string } | null
}

type JobWithRelationsRow = JobRow & {
  accounts: { id: string; name: string; short_name: string } | null
  line_items: (LineItemRow & { tasks: TaskRow[] })[]
  documents: DocumentRow[]
  change_orders: ChangeOrderRow[]
  activity_logs: ActivityRow[]
}

function formatBytes(bytes: number | null | undefined): string | undefined {
  if (bytes == null) return undefined
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function mapOpportunityRow(row: OpportunityWithAccount): Opportunity {
  return {
    id: row.id,
    title: row.title,
    customer: row.accounts?.name ?? "Unknown",
    customerId: normalizeCustomerId(row.account_id ?? ""),
    accountId: row.account_id ?? undefined,
    value: Number(row.value),
    stage: row.stage,
    probability: row.probability,
    closeDate: row.close_date ?? "",
    assignee: row.assignee ?? "",
    assigneeId: row.assignee_id,
    notes: row.notes ?? "",
    organizationId: row.organization_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapAccountRow(row: AccountRow): Account {
  return {
    id: normalizeCustomerId(row.id),
    name: row.name,
    shortName: row.short_name,
    contact: row.contact ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    status: row.status,
    organizationId: row.organization_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    totalJobs: 0,
    activeJobs: 0,
    totalValue: 0,
    ytdValue: 0,
  }
}

export function mapTaskRow(row: TaskRow): Task {
  return {
    id: row.id,
    jobId: row.job_id,
    lineItemId: row.line_item_id,
    title: row.title,
    completed: row.completed,
    assignee: row.assignee ?? "",
    assigneeId: row.assignee_id,
    dueDate: row.due_date ?? "",
    category: row.category,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapLineItemRow(row: LineItemRow, tasks: TaskRow[] = []): LineItem {
  return {
    id: row.id,
    jobId: row.job_id,
    title: row.title,
    description: row.description ?? undefined,
    quantity: row.quantity,
    lineItemNumber: row.line_item_number ?? undefined,
    wipStatus: row.wip_status,
    sortOrder: row.sort_order,
    deliveryDate: row.delivery_date ?? undefined,
    organizationId: row.organization_id,
    tasks: tasks
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapTaskRow),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapDocumentRow(row: DocumentRow): Document {
  return {
    id: row.id,
    jobId: row.job_id,
    lineItemId: row.line_item_id,
    name: row.name,
    type: row.type,
    size: formatBytes(row.size_bytes),
    sizeBytes: row.size_bytes,
    mimeType: row.mime_type,
    googleDriveFileId: row.google_drive_file_id,
    googleDriveFolderId: row.google_drive_folder_id,
    storagePath: row.storage_path,
    webViewLink: row.web_view_link,
    url: row.web_view_link ?? undefined,
    uploadedBy: row.uploaded_by ?? "",
    uploadedById: row.uploaded_by_id,
    uploadedAt: row.created_at,
    preview: row.preview_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapChangeOrderRow(row: ChangeOrderRow): ChangeOrder {
  return {
    id: row.id,
    jobId: row.job_id,
    type: row.type,
    description: row.description,
    impact: row.impact ?? "",
    status: row.status,
    date: row.occurred_on,
    value: row.value,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapActivityRow(row: ActivityRow): Activity {
  return {
    id: row.id,
    jobId: row.job_id,
    user: row.user_name,
    userId: row.user_id,
    action: row.action,
    timestamp: formatTimestamp(row.created_at),
    avatar: row.user_avatar ?? row.user_name.slice(0, 2).toUpperCase(),
    metadata: row.metadata,
  }
}

export function mapJobListItem(row: JobWithAccount): JobListItem {
  return {
    id: row.id,
    jobNumber: row.job_number,
    poNumber: row.po_number,
    description: row.description,
    customer: row.accounts?.name ?? "Unknown",
    customerId: normalizeCustomerId(row.account_id ?? ""),
    accountId: row.account_id ?? undefined,
    status: row.status,
    priority: row.priority,
    deliveryDate: row.delivery_date ?? "",
    tonnage: Number(row.tonnage ?? 0),
    value: Number(row.value),
    progress: row.progress,
    assignees: row.assignees ?? [],
  }
}

export function mapJobRow(
  row: JobWithRelationsRow,
  relations?: {
    line_items?: (LineItemRow & { tasks?: TaskRow[] })[]
    documents?: DocumentRow[]
    change_orders?: ChangeOrderRow[]
    activity_logs?: ActivityRow[]
  }
): Job {
  const lineItemRows = relations?.line_items ?? row.line_items ?? []
  const lineItems = lineItemRows
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((li) => mapLineItemRow(li, li.tasks ?? []))

  const tasks = lineItems.flatMap((li) => li.tasks)

  const documents = (relations?.documents ?? row.documents ?? []).map(mapDocumentRow)
  const changeOrders = (relations?.change_orders ?? row.change_orders ?? []).map(
    mapChangeOrderRow
  )
  const activity = (relations?.activity_logs ?? row.activity_logs ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .map(mapActivityRow)

  return {
    id: row.id,
    jobNumber: row.job_number,
    poNumber: row.po_number,
    customer: row.accounts?.name ?? "Unknown",
    customerId: normalizeCustomerId(row.account_id ?? ""),
    accountId: row.account_id ?? undefined,
    opportunityId: row.opportunity_id,
    description: row.description,
    status: row.status,
    priority: row.priority,
    deliveryDate: row.delivery_date ?? "",
    startDate: row.start_date ?? "",
    tonnage: Number(row.tonnage ?? 0),
    value: Number(row.value),
    markNumbers: row.mark_numbers ?? [],
    assignees: row.assignees ?? [],
    progress: row.progress,
    notes: row.notes ?? "",
    organizationId: row.organization_id,
    googleDriveFolderId: row.google_drive_folder_id,
    jobTemplate: row.job_template,
    lineItems,
    tasks,
    documents,
    changeOrders,
    activity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Map domain Job fields to DB insert shape */
export function toJobInsert(
  job: Partial<Job> & { jobNumber: string; poNumber: string; description: string },
  organizationId: string
): JobInsert {
  return {
    organization_id: organizationId,
    account_id: job.accountId ?? job.customerId ?? null,
    opportunity_id: job.opportunityId ?? null,
    job_number: job.jobNumber,
    po_number: job.poNumber,
    description: job.description,
    status: job.status,
    priority: job.priority,
    delivery_date: job.deliveryDate || null,
    start_date: job.startDate || null,
    tonnage: job.tonnage ?? null,
    value: job.value ?? 0,
    mark_numbers: job.markNumbers ?? [],
    assignees: job.assignees ?? [],
    progress: job.progress ?? 0,
    notes: job.notes ?? null,
    google_drive_folder_id: job.googleDriveFolderId ?? null,
    job_template: job.jobTemplate ?? null,
  }
}

export function toLineItemInsert(
  lineItem: Pick<
    LineItem,
    "title" | "quantity" | "lineItemNumber" | "wipStatus" | "description" | "deliveryDate"
  > & Partial<Pick<LineItem, "sortOrder">>,
  jobId: string,
  organizationId: string
): LineItemInsert {
  return {
    organization_id: organizationId,
    job_id: jobId,
    title: lineItem.title,
    description: lineItem.description ?? null,
    quantity: lineItem.quantity ?? 1,
    line_item_number: lineItem.lineItemNumber ?? null,
    wip_status: lineItem.wipStatus ?? "To Do",
    sort_order: lineItem.sortOrder ?? 0,
    delivery_date: lineItem.deliveryDate || null,
  }
}

export function toTaskInsert(
  task: Pick<Task, "title" | "assignee" | "dueDate" | "category"> &
    Partial<Pick<Task, "completed" | "sortOrder" | "assigneeId">>,
  jobId: string,
  lineItemId: string,
  organizationId: string
): TaskInsert {
  return {
    organization_id: organizationId,
    job_id: jobId,
    line_item_id: lineItemId,
    title: task.title,
    completed: task.completed ?? false,
    assignee: task.assignee || null,
    assignee_id: task.assigneeId ?? null,
    due_date: task.dueDate || null,
    category: task.category,
    sort_order: task.sortOrder ?? 0,
  }
}
