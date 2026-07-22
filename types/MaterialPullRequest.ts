import type { MaterialPullStatus } from "./enums"

/** Domain model used by UI */
export interface MaterialPullRequest {
  id: string
  organizationId: string
  jobId: string | null
  jobNumber: string
  material: string
  quantity: number
  unit: string
  neededBy: string | null
  stage: string | null
  notes: string | null
  status: MaterialPullStatus
  requestedBy: string
  requestedByName: string | null
  sourcedBy: string | null
  pulledBy: string | null
  batchId: string | null
  createdAt: string
  updatedAt: string
}

/** Supabase `material_pull_requests` row */
export interface MaterialPullRequestRow {
  id: string
  organization_id: string
  job_id: string | null
  job_number: string
  material: string
  quantity: number
  unit: string
  needed_by: string | null
  stage: string | null
  notes: string | null
  status: MaterialPullStatus
  requested_by: string
  sourced_by: string | null
  pulled_by: string | null
  batch_id: string | null
  created_at: string
  updated_at: string
}

export interface MaterialPullRequestInsert {
  organization_id: string
  job_id?: string | null
  job_number: string
  material: string
  quantity: number
  unit?: string
  needed_by?: string | null
  stage?: string | null
  notes?: string | null
  status?: MaterialPullStatus
  requested_by: string
  sourced_by?: string | null
  pulled_by?: string | null
  batch_id?: string | null
}

export type MaterialPullRequestUpdate = Partial<
  Omit<MaterialPullRequestInsert, "organization_id" | "requested_by">
>

export interface MaterialPullListFilters {
  status?: MaterialPullStatus | "open" | "all"
  jobNumber?: string
  neededByBefore?: string
  neededByAfter?: string
  batchId?: string
  search?: string
  limit?: number
}

export interface CreateMaterialPullInput {
  jobNumber: string
  jobId?: string | null
  material: string
  quantity: number
  unit?: string
  neededBy?: string | null
  stage?: string | null
  notes?: string | null
}

export interface PushSubscriptionRow {
  id: string
  organization_id: string
  profile_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent: string | null
  created_at: string
}

export interface PushSubscriptionInsert {
  organization_id: string
  profile_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent?: string | null
}
