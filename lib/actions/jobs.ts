"use server"

import { revalidatePath } from "next/cache"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import {
  createJobFromDomain,
  deleteJob,
  getJobById,
  listJobs,
  updateJob,
} from "@/lib/supabase/services/jobs"
import {
  createTaskFromDomain,
  deleteTask,
  reorderTasks,
  toggleTaskCompleted,
  updateTask,
} from "@/lib/supabase/services/tasks"
import { SupabaseServiceError } from "@/lib/supabase/schema"
import type { Job, JobListFilters, JobUpdate, Task, TaskUpdate } from "@/types"

function revalidateJobPaths(jobId?: string) {
  revalidatePath("/jobs")
  revalidatePath("/")
  if (jobId) revalidatePath(`/jobs/${jobId}`)
}

/** Server action wrapper — returns { data } or { error } for client consumption */
async function safeAction<T>(fn: () => Promise<T>): Promise<{ data?: T; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured" }
  }
  try {
    const data = await fn()
    return { data }
  } catch (err) {
    const message =
      err instanceof SupabaseServiceError
        ? err.message
        : err instanceof Error
          ? err.message
          : "An unexpected error occurred"
    return { error: message }
  }
}

// ─── Queries (callable from Server Components directly via services) ─────────

export async function fetchJobByIdAction(id: string) {
  return safeAction(() => getJobById(id))
}

export async function fetchJobsAction(filters?: JobListFilters) {
  return safeAction(() => listJobs(filters))
}

// ─── Job mutations ───────────────────────────────────────────────────────────

export async function createJobAction(
  input: Partial<Job> & { jobNumber: string; poNumber: string; description: string }
) {
  const result = await safeAction(() => createJobFromDomain(input))
  if (result.data) revalidateJobPaths(result.data.id)
  return result
}

export async function updateJobAction(id: string, updates: JobUpdate) {
  const result = await safeAction(() => updateJob(id, updates))
  if (result.data) revalidateJobPaths(id)
  return result
}

export async function deleteJobAction(id: string) {
  const result = await safeAction(async () => {
    await deleteJob(id)
    return { id }
  })
  if (!result.error) revalidateJobPaths()
  return result
}

// ─── Task mutations ──────────────────────────────────────────────────────────

export async function toggleTaskAction(taskId: string, completed: boolean, jobId: string) {
  const result = await safeAction(() => toggleTaskCompleted(taskId, completed))
  if (result.data) revalidateJobPaths(jobId)
  return result
}

export async function updateTaskAction(
  taskId: string,
  updates: TaskUpdate,
  jobId: string
) {
  const result = await safeAction(() => updateTask(taskId, updates))
  if (result.data) revalidateJobPaths(jobId)
  return result
}

export async function createTaskAction(
  jobId: string,
  task: Pick<Task, "title" | "assignee" | "dueDate" | "category">
) {
  const result = await safeAction(() => createTaskFromDomain(jobId, task))
  if (result.data) revalidateJobPaths(jobId)
  return result
}

export async function deleteTaskAction(taskId: string, jobId: string) {
  const result = await safeAction(async () => {
    await deleteTask(taskId)
    return { taskId }
  })
  if (!result.error) revalidateJobPaths(jobId)
  return result
}

export async function reorderTasksAction(jobId: string, orderedTaskIds: string[]) {
  const result = await safeAction(() => reorderTasks(jobId, orderedTaskIds))
  if (result.data) revalidateJobPaths(jobId)
  return result
}
