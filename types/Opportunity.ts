import type { OppStage } from "./enums"

/** Domain model — used by UI and mock data */
export interface Opportunity {
  id: string
  title: string
  customer: string
  customerId: string
  accountId?: string
  value: number
  stage: OppStage
  probability: number
  closeDate: string
  assignee: string
  assigneeId?: string | null
  notes: string
  organizationId?: string
  createdAt?: string
  updatedAt?: string
}

/** Supabase `opportunities` table row (snake_case) */
export interface OpportunityRow {
  id: string
  organization_id: string
  account_id: string | null
  title: string
  value: number
  stage: OppStage
  probability: number
  close_date: string | null
  assignee: string | null
  assignee_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OpportunityInsert {
  organization_id: string
  account_id?: string | null
  title: string
  value?: number
  stage?: OppStage
  probability?: number
  close_date?: string | null
  assignee?: string | null
  assignee_id?: string | null
  notes?: string | null
}

export type OpportunityUpdate = Partial<
  Omit<OpportunityInsert, "organization_id">
>
