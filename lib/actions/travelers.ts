"use server"

import { revalidatePath } from "next/cache"
import { createJobDriveFolderAction } from "@/lib/actions/google-drive"
import { getSessionContext, canWriteJobs } from "@/lib/auth/session"
import { createDriveService } from "@/lib/google/drive"
import { isGoogleDriveFolderId } from "@/lib/google/drive/urls"
import { MAX_UPLOAD_BYTES } from "@/lib/google/drive/mime"
import { parseWorkOrderPdf } from "@/lib/travelers/parse-work-order"
import {
  buildTravelerDocx,
  travelerFilename,
} from "@/lib/travelers/write-traveler"
import type {
  ParsedWorkOrder,
  TravelerCatalogItem,
  TravelerGenerateFields,
  TravelerGeneration,
} from "@/lib/travelers/types"
import { getJobById, updateJob } from "@/lib/supabase/services/jobs"
import { syncDriveFileToDocument } from "@/lib/supabase/services/documents"
import { getUserProfile } from "@/lib/supabase/provision"
import {
  getNextTravelerVersion,
  insertTravelerGeneration,
  listTravelerGenerationsByJobId,
} from "@/lib/supabase/services/travelers"

export type TravelerActionResult<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: string }

function revalidateTraveler(jobId: string) {
  revalidatePath(`/traveler`)
  revalidatePath(`/traveler/jobs/${jobId}`)
  revalidatePath(`/jobs/${jobId}`)
  revalidatePath(`/jobs`)
}

export async function parseWorkOrderAction(
  jobId: string,
  formData: FormData
): Promise<TravelerActionResult<ParsedWorkOrder>> {
  try {
    const ctx = await getSessionContext()
    if (!ctx || !canWriteJobs(ctx.role)) {
      return { error: "You do not have permission to generate travelers." }
    }

    const job = await getJobById(jobId)
    if (!job) return { error: "Job not found." }

    const file = formData.get("file")
    if (!(file instanceof File)) {
      return { error: "No work-order PDF provided." }
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return { error: "File exceeds 50 MB limit." }
    }
    if (
      file.type &&
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return { error: "Please upload a PDF work order." }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const parsed = await parseWorkOrderPdf(buffer)
    return { data: parsed }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse PDF"
    return { error: message }
  }
}

export async function listTravelerGenerationsAction(
  jobId: string
): Promise<TravelerActionResult<TravelerGeneration[]>> {
  try {
    const ctx = await getSessionContext()
    if (!ctx) return { error: "Not signed in." }
    const rows = await listTravelerGenerationsByJobId(jobId)
    return { data: rows }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load traveler history"
    return { error: message }
  }
}

export async function generateTravelerAction(
  jobId: string,
  fields: TravelerGenerateFields
): Promise<
  TravelerActionResult<{
    generation: TravelerGeneration
    webViewLink: string | null
    filename: string
  }>
> {
  try {
    const ctx = await getSessionContext()
    if (!ctx || !canWriteJobs(ctx.role)) {
      return { error: "You do not have permission to generate travelers." }
    }

    const job = await getJobById(jobId)
    if (!job) return { error: "Job not found." }

    const customerPo = fields.customerPo?.trim()
    if (!customerPo || customerPo === "N/A") {
      return { error: "Customer PO is required before generating a traveler." }
    }
    if (!fields.catalogItems?.length) {
      return { error: "Add at least one catalog line item." }
    }
    for (const item of fields.catalogItems) {
      if (!item.structureNumber?.trim()) {
        return {
          error:
            "Fill every Structure # (or use Fill N/A) before generating.",
        }
      }
    }

    const version = await getNextTravelerVersion(jobId, customerPo)
    const filename = travelerFilename(customerPo, version)
    const buffer = await buildTravelerDocx({
      ...fields,
      customerPo,
      revNumber: fields.revNumber?.trim() || "0",
    })

    let folderId = job.googleDriveFolderId
    if (!isGoogleDriveFolderId(folderId)) {
      const created = await createJobDriveFolderAction(jobId)
      if (created.error || !created.data) {
        return {
          error:
            created.error ??
            "Could not create the job Drive folder for the traveler.",
        }
      }
      folderId = created.data.folderId
    }

    const drive = await createDriveService()
    const uploaded = await drive.uploadFile({
      folderId: folderId!,
      filename,
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer,
    })

    const profile = await getUserProfile()
    const uploadedBy = profile?.name ?? ctx.fullName ?? "Team Member"

    const document = await syncDriveFileToDocument(
      jobId,
      {
        id: uploaded.id,
        name: uploaded.name,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
        webViewLink: uploaded.webViewLink,
        thumbnailLink: uploaded.thumbnailLink,
        folderId,
        documentType: "Traveler",
      },
      uploadedBy,
      null
    )

    const structureNumbers = fields.catalogItems
      .map((i: TravelerCatalogItem) => i.structureNumber.trim())
      .join(", ")
    const catalogIds = fields.catalogItems
      .map((i: TravelerCatalogItem) => i.catalogId)
      .join(", ")

    const generation = await insertTravelerGeneration({
      jobId,
      poNumber: customerPo,
      version,
      customer: fields.customer,
      orderDate: fields.orderDate,
      revNumber: fields.revNumber?.trim() || "0",
      structureNumbers,
      catalogIds,
      documentId: document.id,
      generatedBy: ctx.profileId,
    })

    // Soft-sync job PO + mark numbers when helpful
    const markUpdates = fields.catalogItems
      .map((i) => i.structureNumber.trim())
      .filter((s) => s && s.toUpperCase() !== "N/A")
    const existingMarks = new Set(job.markNumbers ?? [])
    const nextMarks = [...(job.markNumbers ?? [])]
    for (const mark of markUpdates) {
      if (!existingMarks.has(mark)) nextMarks.push(mark)
    }
    try {
      await updateJob(jobId, {
        po_number: customerPo,
        ...(nextMarks.length !== (job.markNumbers?.length ?? 0)
          ? { mark_numbers: nextMarks }
          : {}),
      })
    } catch {
      /* non-fatal — traveler already saved */
    }

    revalidateTraveler(jobId)
    return {
      data: {
        generation: {
          ...generation,
          webViewLink: document.webViewLink ?? uploaded.webViewLink,
          documentName: document.name,
        },
        webViewLink: document.webViewLink ?? uploaded.webViewLink ?? null,
        filename,
      },
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate traveler"
    return { error: message }
  }
}
