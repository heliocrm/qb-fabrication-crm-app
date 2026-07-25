/** Sales/relationship follow-up — not shop WIP (see types/Task for line-item checklists) */
export interface CrmTask {
  id: string
  organizationId: string
  title: string
  body: string
  dueAt: string | null
  completedAt: string | null
  ownerId: string
  ownerName?: string | null
  createdBy: string | null
  accountId: string | null
  contactId: string | null
  opportunityId: string | null
  jobId: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CrmTaskRow {
  id: string
  organization_id: string
  title: string
  body: string | null
  due_at: string | null
  completed_at: string | null
  owner_id: string
  created_by: string | null
  account_id: string | null
  contact_id: string | null
  opportunity_id: string | null
  job_id: string | null
  created_at: string
  updated_at: string
}

export interface CrmTaskInsert {
  organization_id: string
  title: string
  body?: string | null
  due_at?: string | null
  completed_at?: string | null
  owner_id: string
  created_by?: string | null
  account_id?: string | null
  contact_id?: string | null
  opportunity_id?: string | null
  job_id?: string | null
}
