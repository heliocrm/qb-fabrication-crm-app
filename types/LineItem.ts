import type { LineItemWipStatus } from "./enums"
import type { Task } from "./Task"

/** Domain model — production line item (Trello card) */
export interface LineItem {
  id: string
  jobId: string
  title: string
  description?: string
  quantity: number
  lineItemNumber?: string
  wipStatus: LineItemWipStatus
  sortOrder: number
  deliveryDate?: string
  organizationId?: string
  tasks: Task[]
  createdAt?: string
  updatedAt?: string
}

/** Supabase `line_items` table row */
export interface LineItemRow {
  id: string
  organization_id: string
  job_id: string
  title: string
  description: string | null
  quantity: number
  line_item_number: string | null
  wip_status: LineItemWipStatus
  sort_order: number
  delivery_date: string | null
  created_at: string
  updated_at: string
}

export interface LineItemInsert {
  organization_id: string
  job_id: string
  title: string
  description?: string | null
  quantity?: number
  line_item_number?: string | null
  wip_status?: LineItemWipStatus
  sort_order?: number
  delivery_date?: string | null
}

export type LineItemUpdate = Partial<
  Omit<LineItemInsert, "organization_id" | "job_id">
>
