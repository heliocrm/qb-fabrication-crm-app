"use server"

import { revalidatePath } from "next/cache"
import {
  canSignOffFloor,
  getSessionContext,
} from "@/lib/auth/session"
import {
  listFloorWorkersForSignoff,
  setOrgUserFloorPin,
  clearOrgUserFloorPin,
} from "@/lib/supabase/services/profiles"
import {
  listLatestSignoffsForJob,
  listLatestSignoffsForLineItem,
  signOffFloorTask,
} from "@/lib/supabase/services/task-signoffs"
import { listTasksByLineItemId } from "@/lib/supabase/services/tasks"
import { isFloorTaskCategory } from "@/lib/floor-signoff-reasons"
import { getActiveTravelerByJobId } from "@/lib/supabase/services/travelers"
import type { FloorWorkerOption, Task, TaskSignoff, Traveler } from "@/types"

export type FloorActionResult<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: string }

function revalidateFloor(jobId: string) {
  revalidatePath(`/jobs/${jobId}`)
  revalidatePath(`/traveler/jobs/${jobId}`)
  revalidatePath(`/traveler`)
}

export async function listFloorWorkersAction(): Promise<
  FloorActionResult<FloorWorkerOption[]>
> {
  try {
    const ctx = await getSessionContext()
    if (!ctx || !canSignOffFloor(ctx.role)) {
      return { error: "You do not have permission to sign off on the floor." }
    }
    const workers = await listFloorWorkersForSignoff(ctx.organizationId)
    return { data: workers }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to load workers",
    }
  }
}

export async function getFloorSignoffContextAction(jobId: string): Promise<
  FloorActionResult<{
    isStationAccount: boolean
    selfProfileId: string
    selfFullName: string
    workers: FloorWorkerOption[]
    traveler: Traveler | null
    signoffsByTaskId: Record<string, TaskSignoff>
  }>
> {
  try {
    const ctx = await getSessionContext()
    if (!ctx || !canSignOffFloor(ctx.role)) {
      return { error: "You do not have permission to sign off on the floor." }
    }
    const [workers, traveler, signoffsByTaskId] = await Promise.all([
      listFloorWorkersForSignoff(ctx.organizationId),
      getActiveTravelerByJobId(jobId),
      listLatestSignoffsForJob(jobId),
    ])
    return {
      data: {
        isStationAccount: ctx.isStationAccount,
        selfProfileId: ctx.profileId,
        selfFullName: ctx.fullName,
        workers,
        traveler,
        signoffsByTaskId,
      },
    }
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to load sign-off context",
    }
  }
}

export async function listFloorTasksForLineItemAction(
  lineItemId: string
): Promise<
  FloorActionResult<{ tasks: Task[]; signoffsByTaskId: Record<string, TaskSignoff> }>
> {
  try {
    const ctx = await getSessionContext()
    if (!ctx || !canSignOffFloor(ctx.role)) {
      return { error: "You do not have permission to view floor tasks." }
    }
    const [allTasks, signoffsByTaskId] = await Promise.all([
      listTasksByLineItemId(lineItemId),
      listLatestSignoffsForLineItem(lineItemId),
    ])
    return {
      data: {
        tasks: allTasks.filter((t) => isFloorTaskCategory(t.category)),
        signoffsByTaskId,
      },
    }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to load floor tasks",
    }
  }
}

export async function signOffTaskAction(input: {
  jobId: string
  taskId: string
  workerProfileId: string
  pin: string
  reasonCodes: string[]
  note?: string
  travelerLineId?: string | null
}): Promise<FloorActionResult<{ signoff: TaskSignoff }>> {
  try {
    const ctx = await getSessionContext()
    if (!ctx || !canSignOffFloor(ctx.role)) {
      return { error: "You do not have permission to sign off on the floor." }
    }
    if (!ctx.isActive) {
      return { error: "Account is inactive." }
    }

    const signoff = await signOffFloorTask({
      taskId: input.taskId,
      workerProfileId: input.workerProfileId,
      sessionProfileId: ctx.profileId,
      pin: input.pin,
      reasonCodes: input.reasonCodes,
      note: input.note,
      travelerLineId: input.travelerLineId,
    })

    revalidateFloor(input.jobId)
    return { data: { signoff } }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Sign-off failed",
    }
  }
}

export async function setFloorPinAction(
  profileId: string,
  pin: string
): Promise<FloorActionResult<{ hasFloorPin: boolean }>> {
  try {
    const { requireAdmin } = await import("@/lib/auth/session")
    const ctx = await requireAdmin()
    const user = await setOrgUserFloorPin(profileId, pin, ctx.organizationId)
    revalidatePath("/admin")
    return { data: { hasFloorPin: user.hasFloorPin } }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to set PIN",
    }
  }
}

export async function clearFloorPinAction(
  profileId: string
): Promise<FloorActionResult<{ hasFloorPin: boolean }>> {
  try {
    const { requireAdmin } = await import("@/lib/auth/session")
    const ctx = await requireAdmin()
    const user = await clearOrgUserFloorPin(profileId, ctx.organizationId)
    revalidatePath("/admin")
    return { data: { hasFloorPin: user.hasFloorPin } }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to clear PIN",
    }
  }
}
