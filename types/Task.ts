import type { TaskCategory } from "./enums"

/** Domain model — used by UI and mock data */
export interface Task {
  id: string
  jobId?: string
  title: string
  completed: boolean
  assignee: string
  assigneeId?: string | null
  dueDate: string
  category: TaskCategory
  sortOrder?: number
  createdAt?: string
  updatedAt?: string
}

/** Supabase `tasks` table row (snake_case) */
export interface TaskRow {
  id: string
  organization_id: string
  job_id: string
  title: string
  completed: boolean
  assignee: string | null
  assignee_id: string | null
  due_date: string | null
  category: TaskCategory
  sort_order: number
  created_at: string
  updated_at: string
}

export interface TaskInsert {
  organization_id: string
  job_id: string
  title: string
  completed?: boolean
  assignee?: string | null
  assignee_id?: string | null
  due_date?: string | null
  category?: TaskCategory
  sort_order?: number
}

export type TaskUpdate = Partial<
  Omit<TaskInsert, "organization_id" | "job_id">
>
