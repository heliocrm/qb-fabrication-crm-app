import type { ProfileSummary } from "./Profile"
import type { ChangeOrder } from "./ChangeOrder"
import type { Document } from "./Document"
import type { JobStatus, JobTemplateType, Priority } from "./enums"
import type { LineItem } from "./LineItem"
import type { Task } from "./Task"

/** Activity log entry (domain) */
export interface Activity {
  id: string
  jobId?: string
  user: string
  userId?: string | null
  action: string
  timestamp: string
  avatar: string
  metadata?: Record<string, unknown> | null
}

/** Supabase `activity_logs` table row */
export interface ActivityRow {
  id: string
  organization_id: string
  job_id: string
  user_id: string | null
  user_name: string
  user_avatar: string | null
  action: string
  metadata: Record<string, unknown> | null
  created_at: string
}

/** Domain model — primary shape used by UI */
export interface Job {
  id: string
  jobNumber: string
  poNumber: string
  customer: string
  customerId: string
  accountId?: string
  opportunityId?: string | null
  description: string
  status: JobStatus
  priority: Priority
  deliveryDate: string
  startDate: string
  tonnage: number
  value: number
  markNumbers: string[]
  /** @deprecated Use assignedUsers — legacy text[] from jobs.assignees */
  assignees?: string[]
  /** Profile-linked shop team (from job_assignees) */
  assignedUsers?: ProfileSummary[]
  progress: number
  notes: string
  organizationId?: string
  googleDriveFolderId?: string | null
  jobTemplate?: JobTemplateType | null
  lineItems: LineItem[]
  /** Flattened tasks across all line items (convenience for stats) */
  tasks: Task[]
  documents: Document[]
  changeOrders: ChangeOrder[]
  activity: Activity[]
  createdAt?: string
  updatedAt?: string
}

/** Job with all relations loaded from Supabase */
export type JobWithRelations = Job

/** Supabase `jobs` table row (snake_case) */
export interface JobRow {
  id: string
  organization_id: string
  account_id: string | null
  opportunity_id: string | null
  job_number: string
  po_number: string
  description: string
  status: JobStatus
  priority: Priority
  delivery_date: string | null
  start_date: string | null
  tonnage: number | null
  value: number
  mark_numbers: string[]
  assignees: string[]
  progress: number
  notes: string | null
  google_drive_folder_id: string | null
  job_template: JobTemplateType | null
  created_at: string
  updated_at: string
}

export interface JobInsert {
  organization_id: string
  account_id?: string | null
  opportunity_id?: string | null
  job_number: string
  po_number: string
  description: string
  status?: JobStatus
  priority?: Priority
  delivery_date?: string | null
  start_date?: string | null
  tonnage?: number | null
  value?: number
  mark_numbers?: string[]
  assignees?: string[]
  progress?: number
  notes?: string | null
  google_drive_folder_id?: string | null
  job_template?: JobTemplateType | null
}

export type JobUpdate = Partial<Omit<JobInsert, "organization_id">>

/** Filters for listJobs query */
export interface JobListFilters {
  search?: string
  customerId?: string
  accountId?: string
  status?: JobStatus
  priority?: Priority
  limit?: number
  offset?: number
}

/** List item — lighter than full JobWithRelations */
export interface JobListItem {
  id: string
  jobNumber: string
  poNumber: string
  description: string
  customer: string
  customerId: string
  accountId?: string
  status: JobStatus
  priority: Priority
  deliveryDate: string
  tonnage: number
  value: number
  progress: number
  /** @deprecated Use assignedUsers */
  assignees?: string[]
  /** Profile-linked shop team (from job_assignees) */
  assignedUsers?: ProfileSummary[]
}
