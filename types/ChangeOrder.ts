import type { ChangeOrderStatus, ChangeOrderType } from "./enums"

/** Domain model — used by UI and mock data */
export interface ChangeOrder {
  id: string
  jobId?: string
  type: ChangeOrderType
  description: string
  impact: string
  status: ChangeOrderStatus
  /** ISO date string (UI uses `date`; DB uses `occurred_on`) */
  date: string
  value?: number | null
  createdBy?: string | null
  createdAt?: string
  updatedAt?: string
}

/** Supabase `change_orders` table row (snake_case) */
export interface ChangeOrderRow {
  id: string
  organization_id: string
  job_id: string
  type: ChangeOrderType
  description: string
  impact: string | null
  status: ChangeOrderStatus
  occurred_on: string
  value: number | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ChangeOrderInsert {
  organization_id: string
  job_id: string
  type: ChangeOrderType
  description: string
  impact?: string | null
  status?: ChangeOrderStatus
  occurred_on?: string
  value?: number | null
  created_by?: string | null
}

export type ChangeOrderUpdate = Partial<
  Omit<ChangeOrderInsert, "organization_id" | "job_id">
>
