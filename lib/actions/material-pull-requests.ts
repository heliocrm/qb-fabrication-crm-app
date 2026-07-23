"use server"

import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import {
  canCreateMaterialRequests,
  canManageMaterialRequests,
  requireSessionContext,
} from "@/lib/auth/session"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { SupabaseServiceError } from "@/lib/supabase/schema"
import {
  assignMaterialPullBatch,
  cancelMaterialPullRequest,
  createMaterialPullRequest,
  listMaterialPullRequests,
  markBatchPulled,
  updateMaterialPullStatus,
} from "@/lib/supabase/services/material-pull-requests"
import { notifyMaterialPullEvent } from "@/lib/notifications/material-pull"
import type {
  CreateMaterialPullInput,
  MaterialPullListFilters,
  MaterialPullStatus,
} from "@/types"

function revalidateMaterialPaths() {
  revalidatePath("/material-requests")
  revalidatePath("/material-requests/new")
  revalidatePath("/material-requests/batch")
  revalidatePath("/pull")
  revalidatePath("/pull/new")
  revalidatePath("/pull/batch")
}

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

function fireNotify(
  fn: () => Promise<void>
): void {
  void fn().catch((err) => {
    console.error("[material-pull notify]", err)
  })
}

export async function fetchMaterialPullRequestsAction(
  filters?: MaterialPullListFilters
) {
  return safeAction(async () => {
    await requireSessionContext()
    return listMaterialPullRequests(filters)
  })
}

export async function createMaterialPullRequestAction(input: CreateMaterialPullInput) {
  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    if (!canCreateMaterialRequests(ctx.role)) {
      throw new Error("You do not have permission to create material requests")
    }
    if (!input.jobNumber?.trim() || !input.material?.trim() || !(input.quantity > 0)) {
      throw new Error("Job number, material, and quantity are required")
    }
    return createMaterialPullRequest(input, ctx.profileId)
  })

  if (result.data) {
    revalidateMaterialPaths()
    fireNotify(() =>
      notifyMaterialPullEvent({
        type: "created",
        request: result.data!,
        actorProfileId: result.data!.requestedBy,
      })
    )
  }
  return result
}

export async function updateMaterialPullStatusAction(
  id: string,
  status: MaterialPullStatus
) {
  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    if (!canManageMaterialRequests(ctx.role)) {
      throw new Error("Only managers and admins can update request status")
    }
    return updateMaterialPullStatus(id, status, ctx.profileId)
  })

  if (result.data) {
    revalidateMaterialPaths()
    fireNotify(() =>
      notifyMaterialPullEvent({
        type: "status_changed",
        request: result.data!,
        actorProfileId: result.data!.approvedBy ?? result.data!.pulledBy ?? result.data!.requestedBy,
        previousStatus: undefined,
      })
    )
  }
  return result
}

export async function cancelMaterialPullRequestAction(id: string) {
  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    const isManager = canManageMaterialRequests(ctx.role)
    return cancelMaterialPullRequest(id, ctx.profileId, isManager)
  })

  if (result.data) {
    revalidateMaterialPaths()
    fireNotify(() =>
      notifyMaterialPullEvent({
        type: "cancelled",
        request: result.data!,
        actorProfileId: result.data!.requestedBy,
      })
    )
  }
  return result
}

export async function createMaterialPullBatchAction(ids: string[]) {
  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    if (!canManageMaterialRequests(ctx.role)) {
      throw new Error("Only managers and admins can create pull batches")
    }
    if (ids.length === 0) {
      throw new Error("Select at least one request")
    }
    const batchId = randomUUID()
    return assignMaterialPullBatch(ids, batchId)
  })

  if (result.data) {
    revalidateMaterialPaths()
    const first = result.data[0]
    if (first) {
      fireNotify(() =>
        notifyMaterialPullEvent({
          type: "batched",
          request: first,
          actorProfileId: first.approvedBy ?? first.requestedBy,
          batchCount: result.data!.length,
          batchId: first.batchId,
        })
      )
    }
  }
  return result
}

export async function clearMaterialPullBatchAction(ids: string[]) {
  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    if (!canManageMaterialRequests(ctx.role)) {
      throw new Error("Only managers and admins can clear batches")
    }
    return assignMaterialPullBatch(ids, null)
  })
  if (result.data) revalidateMaterialPaths()
  return result
}

export async function markBatchPulledAction(
  batchId: string,
  completion?: {
    pullNotes?: string | null
    pullChecklist?: import("@/lib/material-pull-config").MaterialPullChecklist | null
  }
) {
  let actorProfileId = ""
  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    actorProfileId = ctx.profileId
    if (!canManageMaterialRequests(ctx.role)) {
      throw new Error("Only managers and admins can mark batches pulled")
    }
    return markBatchPulled(batchId, ctx.profileId, completion)
  })

  if (result.data?.length) {
    revalidateMaterialPaths()
    for (const request of result.data) {
      fireNotify(() =>
        notifyMaterialPullEvent({
          type: "status_changed",
          request,
          actorProfileId: actorProfileId || request.pulledBy || request.requestedBy,
        })
      )
    }
  }
  return result
}
