"use server"

import { revalidatePath } from "next/cache"
import {
  canCreateJobs,
  canWriteJobs,
  requireManagerOrAdmin,
  requireSessionContext,
} from "@/lib/auth/session"
import {
  createJobFromDomain,
  createJobFromTemplate,
  deleteJob,
  getJobById,
  listJobs,
  updateJob,
  type CreateJobFromTemplateInput,
} from "@/lib/supabase/services/jobs"
import {
  createLineItemWithTemplateTasks,
  deleteLineItem,
  updateLineItem,
} from "@/lib/supabase/services/line-items"
import { setJobAssignees } from "@/lib/supabase/services/job-assignees"
import { listOrgUsersForPicker } from "@/lib/supabase/services/profiles"
import {
  createTaskFromDomain,
  deleteTask,
  reorderTasks,
  toggleTaskCompleted,
  updateTask,
} from "@/lib/supabase/services/tasks"
import { SupabaseServiceError } from "@/lib/supabase/schema"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import type {
  Job,
  JobListFilters,
  JobTemplateType,
  JobUpdate,
  LineItemUpdate,
  LineItemWipStatus,
  Task,
  TaskUpdate,
} from "@/types"

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
  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    if (!canCreateJobs(ctx.role)) {
      throw new Error("Only managers and admins can create jobs")
    }
    return createJobFromDomain(input)
  })
  if (result.data) revalidateJobPaths(result.data.id)
  return result
}

export async function createJobFromTemplateAction(input: CreateJobFromTemplateInput) {
  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    if (!canCreateJobs(ctx.role)) {
      throw new Error("Only managers and admins can create jobs")
    }
    return createJobFromTemplate(input)
  })
  if (result.data) revalidateJobPaths(result.data.id)
  return result
}

export async function updateJobAction(id: string, updates: JobUpdate) {
  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    const becomingDelivered = updates.status === "Delivered"
    let previousStatus: string | null = null

    if (becomingDelivered) {
      const before = await getJobById(id)
      previousStatus = before?.status ?? null
    }

    const job = await updateJob(id, updates)

    if (becomingDelivered && previousStatus !== "Delivered") {
      try {
        const { ensureDeliveredCheckInFollowUp } = await import(
          "@/lib/supabase/services/job-delivered-followup"
        )
        const followUp = await ensureDeliveredCheckInFollowUp({
          jobId: job.id,
          jobNumber: job.jobNumber,
          accountId: job.accountId ?? null,
          actorProfileId: ctx.profileId,
        })
        if (followUp?.accountId) {
          revalidatePath("/customers")
          revalidatePath("/customers/needs-a-touch")
        }
      } catch (err) {
        console.error("[updateJobAction] Delivered check-in follow-up failed", err)
      }
    }

    return job
  })
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

// ─── Line item mutations ─────────────────────────────────────────────────────

async function requireJobWrite() {
  const ctx = await requireSessionContext()
  if (!canWriteJobs(ctx.role)) {
    throw new Error("You do not have permission to edit jobs")
  }
  return ctx
}

export async function createLineItemAction(
  jobId: string,
  template: JobTemplateType,
  fields: { title: string; quantity?: number; lineItemNumber?: string }
) {
  const result = await safeAction(async () => {
    await requireJobWrite()
    return createLineItemWithTemplateTasks(jobId, template, {
      title: fields.title,
      quantity: fields.quantity ?? 1,
      lineItemNumber: fields.lineItemNumber,
      wipStatus: "To Do",
    })
  })
  if (result.data) revalidateJobPaths(jobId)
  return result
}

export async function updateLineItemWipAction(
  lineItemId: string,
  wipStatus: LineItemWipStatus,
  jobId: string
) {
  const result = await safeAction(async () => {
    await requireJobWrite()
    return updateLineItem(lineItemId, { wip_status: wipStatus })
  })
  if (result.data) revalidateJobPaths(jobId)
  return result
}

export async function deleteLineItemAction(lineItemId: string, jobId: string) {
  const result = await safeAction(async () => {
    await requireJobWrite()
    await deleteLineItem(lineItemId)
    return { lineItemId }
  })
  if (!result.error) revalidateJobPaths(jobId)
  return result
}

// ─── Task mutations ──────────────────────────────────────────────────────────

export async function toggleTaskAction(taskId: string, completed: boolean, jobId: string) {
  const result = await safeAction(async () => {
    await requireJobWrite()
    return toggleTaskCompleted(taskId, completed)
  })
  if (result.data) revalidateJobPaths(jobId)
  return result
}

export async function updateTaskAction(
  taskId: string,
  updates: TaskUpdate,
  jobId: string
) {
  const result = await safeAction(async () => {
    await requireJobWrite()
    return updateTask(taskId, updates)
  })
  if (result.data) revalidateJobPaths(jobId)
  return result
}

export async function createTaskAction(
  jobId: string,
  lineItemId: string,
  task: Pick<Task, "title" | "assignee" | "dueDate" | "category"> &
    Partial<Pick<Task, "assigneeId">>
) {
  const result = await safeAction(async () => {
    await requireJobWrite()
    return createTaskFromDomain(jobId, lineItemId, task)
  })
  if (result.data) revalidateJobPaths(jobId)
  return result
}

export async function deleteTaskAction(taskId: string, jobId: string) {
  const result = await safeAction(async () => {
    await requireJobWrite()
    await deleteTask(taskId)
    return { taskId }
  })
  if (!result.error) revalidateJobPaths(jobId)
  return result
}

export async function reorderTasksAction(
  lineItemId: string,
  orderedTaskIds: string[],
  jobId: string
) {
  const result = await safeAction(async () => {
    await requireJobWrite()
    return reorderTasks(lineItemId, orderedTaskIds)
  })
  if (result.data) revalidateJobPaths(jobId)
  return result
}

export async function setJobAssigneesAction(jobId: string, profileIds: string[]) {
  const result = await safeAction(async () => {
    const ctx = await requireManagerOrAdmin()
    return setJobAssignees(jobId, profileIds, ctx.profileId)
  })
  if (result.data) revalidateJobPaths(jobId)
  return result
}

export async function listOrgUsersForPickerAction() {
  return safeAction(async () => {
    await requireJobWrite()
    return listOrgUsersForPicker()
  })
}
