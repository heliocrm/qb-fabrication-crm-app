export type CrmActivityKind =
  | "note"
  | "call"
  | "meeting"
  | "touch"
  | "email"

export interface CrmActivity {
  id: string
  organizationId: string
  accountId: string | null
  contactId: string | null
  jobId: string | null
  kind: CrmActivityKind
  body: string
  occurredAt: string
  createdBy: string | null
  createdByName?: string | null
  metadata: Record<string, unknown>
  externalSource?: string | null
  externalId?: string | null
  createdAt?: string
}

export interface CrmActivityRow {
  id: string
  organization_id: string
  account_id: string | null
  contact_id: string | null
  job_id: string | null
  kind: CrmActivityKind
  body: string
  occurred_at: string
  created_by: string | null
  metadata: Record<string, unknown> | null
  external_source?: string | null
  external_id?: string | null
  created_at: string
}

export interface CrmActivityInsert {
  organization_id: string
  account_id?: string | null
  contact_id?: string | null
  job_id?: string | null
  kind?: CrmActivityKind
  body: string
  occurred_at?: string
  created_by?: string | null
  metadata?: Record<string, unknown> | null
  external_source?: string | null
  external_id?: string | null
}
