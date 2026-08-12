"use server"

import { revalidatePath } from "next/cache"
import { getSessionContext, canWriteJobs } from "@/lib/auth/session"
import {
  deleteDrawingCropTemplate,
  insertDrawingPacket,
  listDrawingCropTemplates,
  upsertDrawingCropTemplate,
  type DrawingCropTemplateRow,
} from "@/lib/supabase/services/drawing-packets"
import type { CropTemplateData } from "@/lib/drawing-packet/stamp-engine"
import { uploadJobDriveFileAction } from "@/lib/actions/google-drive"
import { getActiveTravelerByJobId } from "@/lib/supabase/services/travelers"

export type DrawingPacketActionResult<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: string }

export async function listCropTemplatesAction(): Promise<
  DrawingPacketActionResult<DrawingCropTemplateRow[]>
> {
  try {
    const ctx = await getSessionContext()
    if (!ctx) return { error: "Not signed in." }
    const rows = await listDrawingCropTemplates()
    return { data: rows }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to load templates",
    }
  }
}

export async function saveCropTemplateAction(
  name: string,
  data: CropTemplateData
): Promise<DrawingPacketActionResult<DrawingCropTemplateRow>> {
  try {
    const ctx = await getSessionContext()
    if (!ctx || !canWriteJobs(ctx.role)) {
      return { error: "You do not have permission to save crop templates." }
    }
    if (!name.trim()) return { error: "Template name is required." }
    const row = await upsertDrawingCropTemplate({ name, data })
    return { data: row }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to save template",
    }
  }
}

export async function deleteCropTemplateAction(
  name: string
): Promise<DrawingPacketActionResult<{ ok: true }>> {
  try {
    const ctx = await getSessionContext()
    if (!ctx || !canWriteJobs(ctx.role)) {
      return { error: "You do not have permission to delete crop templates." }
    }
    await deleteDrawingCropTemplate(name)
    return { data: { ok: true } }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to delete template",
    }
  }
}

export async function saveDrawingPacketAction(
  jobId: string,
  formData: FormData
): Promise<
  DrawingPacketActionResult<{ documentId: string; webViewLink?: string | null }>
> {
  try {
    const ctx = await getSessionContext()
    if (!ctx || !canWriteJobs(ctx.role)) {
      return { error: "You do not have permission to save drawing packets." }
    }

    const pageCount = Number(formData.get("pageCount") || 0) || null
    const revNumber = String(formData.get("revNumber") || "")
    const poNumber = String(formData.get("poNumber") || "")

    const uploaded = await uploadJobDriveFileAction(
      jobId,
      formData,
      null,
      "Drawing Packet"
    )
    if (uploaded.error || !uploaded.data) {
      return { error: uploaded.error ?? "Drive upload failed" }
    }

    let travelerId: string | null = null
    try {
      const traveler = await getActiveTravelerByJobId(jobId)
      travelerId = traveler?.id ?? null
    } catch {
      travelerId = null
    }

    await insertDrawingPacket({
      jobId,
      travelerId,
      documentId: uploaded.data.document.id,
      poNumber,
      revNumber,
      pageCount,
    })

    revalidatePath(`/jobs/${jobId}`)
    revalidatePath(`/traveler/jobs/${jobId}`)
    return {
      data: {
        documentId: uploaded.data.document.id,
        webViewLink: uploaded.data.document.webViewLink,
      },
    }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to save drawing packet",
    }
  }
}
