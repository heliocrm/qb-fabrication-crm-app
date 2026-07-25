import type { FloorSignoffReasonCode } from "@/lib/floor-signoff-reasons"

export interface TaskSignoff {
  id: string
  organizationId: string
  jobId: string
  lineItemId: string
  taskId: string
  travelerLineId: string | null
  signedBy: string
  signedByName: string | null
  sessionProfileId: string
  reasonCodes: FloorSignoffReasonCode[]
  note: string | null
  signedAt: string
}

export interface TaskSignoffRow {
  id: string
  organization_id: string
  job_id: string
  line_item_id: string
  task_id: string
  traveler_line_id: string | null
  signed_by: string
  session_profile_id: string
  reason_codes: string[]
  note: string | null
  signed_at: string
}
