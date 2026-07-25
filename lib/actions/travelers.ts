"use server"

import { revalidatePath } from "next/cache"
import { getSessionContext, canWriteJobs } from "@/lib/auth/session"
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
import {
  getActiveTravelerByJobId,
  getNextTravelerVersion,
  getTravelerById,
  importDigitalTraveler,
  insertTravelerGeneration,
  listTravelerGenerationsByJobId,
  listTravelersByJobId,
  updateTravelerLine,
} from "@/lib/supabase/services/travelers"
import { sendTravelerEmail } from "@/lib/email/send-traveler"
import type { Traveler } from "@/types"

export type TravelerActionResult<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: string }

function revalidateTraveler(jobId: string) {
  revalidatePath(`/traveler`)
  revalidatePath(`/traveler/jobs/${jobId}`)
  revalidatePath(`/traveler/jobs/${jobId}/print`)
  revalidatePath(`/jobs/${jobId}`)
  revalidatePath(`/jobs/${jobId}/traveler/print`)
  revalidatePath(`/jobs`)
}

function validateImportFields(fields: TravelerGenerateFields): string | null {
  const customerPo = fields.customerPo?.trim()
  if (!customerPo || customerPo === "N/A") {
    return "Customer PO is required before importing a traveler."
  }
  if (!fields.catalogItems?.length) {
    return "Add at least one catalog line item."
  }
  for (const item of fields.catalogItems) {
    if (!item.catalogId?.trim()) {
      return "Every line needs a Catalog ID."
    }
    if (!item.structureNumber?.trim()) {
      return "Fill every Structure # (or use Fill N/A) before importing."
    }
  }
  return null
}

function fieldsToGenerate(traveler: Traveler): TravelerGenerateFields {
  return {
    customerPo: traveler.poNumber,
    orderDate: traveler.orderDate ?? "N/A",
    customer: traveler.customer ?? "N/A",
    revNumber: traveler.revNumber ?? "0",
    qbSalesOrder: traveler.qbSalesOrder ?? undefined,
    shipDate: traveler.shipDate ?? undefined,
    catalogItems: traveler.lines.map((line) => ({
      catalogId: line.catalogId,
      description: line.description ?? "",
      structureNumber: line.structureNumber ?? "N/A",
      lineNumber: line.lineNumber ?? undefined,
      quantity: line.quantity,
    })),
  }
}

async function softSyncJobFromFields(
  jobId: string,
  fields: TravelerGenerateFields
) {
  const job = await getJobById(jobId)
  if (!job) return
  const customerPo = fields.customerPo.trim()
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
    /* non-fatal */
  }
}

export async function parseWorkOrderAction(
  jobId: string,
  formData: FormData
): Promise<TravelerActionResult<ParsedWorkOrder>> {
  try {
    const ctx = await getSessionContext()
    if (!ctx || !canWriteJobs(ctx.role)) {
      return { error: "You do not have permission to import travelers." }
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

export async function getActiveTravelerAction(
  jobId: string
): Promise<TravelerActionResult<Traveler | null>> {
  try {
    const ctx = await getSessionContext()
    if (!ctx) return { error: "Not signed in." }
    const traveler = await getActiveTravelerByJobId(jobId)
    return { data: traveler }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load traveler"
    return { error: message }
  }
}

export async function listDigitalTravelersAction(
  jobId: string
): Promise<TravelerActionResult<Traveler[]>> {
  try {
    const ctx = await getSessionContext()
    if (!ctx) return { error: "Not signed in." }
    const rows = await listTravelersByJobId(jobId)
    return { data: rows }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load travelers"
    return { error: message }
  }
}

/** Primary path: import WO into in-system digital traveler + CRM line items. */
export async function importTravelerAction(
  jobId: string,
  fields: TravelerGenerateFields
): Promise<TravelerActionResult<{ traveler: Traveler }>> {
  try {
    const ctx = await getSessionContext()
    if (!ctx || !canWriteJobs(ctx.role)) {
      return { error: "You do not have permission to import travelers." }
    }

    const job = await getJobById(jobId)
    if (!job) return { error: "Job not found." }

    const validationError = validateImportFields(fields)
    if (validationError) return { error: validationError }

    const traveler = await importDigitalTraveler({
      jobId,
      fields: {
        customerPo: fields.customerPo.trim(),
        orderDate: fields.orderDate,
        customer: fields.customer,
        revNumber: fields.revNumber?.trim() || "0",
        qbSalesOrder: fields.qbSalesOrder,
        shipDate: fields.shipDate,
        catalogItems: fields.catalogItems,
      },
      jobTemplate: job.jobTemplate,
      importedBy: ctx.profileId,
    })

    await softSyncJobFromFields(jobId, fields)
    revalidateTraveler(jobId)
    return { data: { traveler } }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to import traveler"
    return { error: message }
  }
}

export async function updateTravelerLineAction(
  jobId: string,
  lineId: string,
  updates: {
    structureNumber?: string
    description?: string
    catalogId?: string
    quantity?: number
  }
): Promise<TravelerActionResult<{ line: Traveler["lines"][number] }>> {
  try {
    const ctx = await getSessionContext()
    if (!ctx || !canWriteJobs(ctx.role)) {
      return { error: "You do not have permission to edit travelers." }
    }
    const line = await updateTravelerLine(lineId, updates)
    if (line.jobId !== jobId) {
      return { error: "Traveler line does not belong to this job." }
    }
    revalidateTraveler(jobId)
    return { data: { line } }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update traveler line"
    return { error: message }
  }
}

/** On-demand DOCX from the active digital traveler (no Drive upload). */
export async function downloadTravelerDocxAction(
  jobId: string
): Promise<
  TravelerActionResult<{
    filename: string
    base64: string
    generation: TravelerGeneration
  }>
> {
  try {
    const ctx = await getSessionContext()
    if (!ctx || !canWriteJobs(ctx.role)) {
      return { error: "You do not have permission to export travelers." }
    }

    const traveler = await getActiveTravelerByJobId(jobId)
    if (!traveler) {
      return { error: "No active traveler on this job. Import a work order first." }
    }

    const fields = fieldsToGenerate(traveler)
    const version = await getNextTravelerVersion(jobId, traveler.poNumber)
    const filename = travelerFilename(traveler.poNumber, version)
    const buffer = await buildTravelerDocx(fields)

    const structureNumbers = fields.catalogItems
      .map((i: TravelerCatalogItem) => i.structureNumber.trim())
      .join(", ")
    const catalogIds = fields.catalogItems
      .map((i: TravelerCatalogItem) => i.catalogId)
      .join(", ")

    const generation = await insertTravelerGeneration({
      jobId,
      poNumber: traveler.poNumber,
      version,
      customer: traveler.customer,
      orderDate: traveler.orderDate,
      revNumber: traveler.revNumber,
      structureNumbers,
      catalogIds,
      documentId: null,
      generatedBy: ctx.profileId,
    })

    revalidateTraveler(jobId)
    return {
      data: {
        filename,
        base64: buffer.toString("base64"),
        generation,
      },
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to export traveler DOCX"
    return { error: message }
  }
}

export async function emailTravelerAction(
  jobId: string,
  toEmail: string
): Promise<TravelerActionResult<{ sent: boolean }>> {
  try {
    const ctx = await getSessionContext()
    if (!ctx || !canWriteJobs(ctx.role)) {
      return { error: "You do not have permission to email travelers." }
    }

    const email = toEmail.trim()
    if (!email || !email.includes("@")) {
      return { error: "Enter a valid email address." }
    }

    const job = await getJobById(jobId)
    if (!job) return { error: "Job not found." }

    const traveler = await getActiveTravelerByJobId(jobId)
    if (!traveler) {
      return { error: "No active traveler on this job. Import a work order first." }
    }

    const sent = await sendTravelerEmail({
      to: email,
      fullName: ctx.fullName ?? "Team",
      jobNumber: job.jobNumber,
      poNumber: traveler.poNumber,
      customer: traveler.customer ?? "Customer",
      urlPath: `/jobs/${jobId}?tab=traveler`,
    })

    if (!sent) {
      return {
        error:
          "Email could not be sent. Check that Resend is configured (RESEND_API_KEY).",
      }
    }
    return { data: { sent: true } }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to email traveler"
    return { error: message }
  }
}

/** @deprecated Prefer importTravelerAction — kept for any legacy callers. */
export async function generateTravelerAction(
  jobId: string,
  fields: TravelerGenerateFields
): Promise<
  TravelerActionResult<{
    traveler: Traveler
    generation?: TravelerGeneration
    webViewLink: string | null
    filename: string
  }>
> {
  const imported = await importTravelerAction(jobId, fields)
  if (imported.error || !imported.data) {
    return { error: imported.error ?? "Import failed" }
  }
  return {
    data: {
      traveler: imported.data.traveler,
      webViewLink: null,
      filename: `TRV-${imported.data.traveler.poNumber}`,
    },
  }
}

export async function getTravelerForPrintAction(
  jobId: string
): Promise<TravelerActionResult<{ traveler: Traveler; jobNumber: string }>> {
  try {
    const ctx = await getSessionContext()
    if (!ctx) return { error: "Not signed in." }
    const job = await getJobById(jobId)
    if (!job) return { error: "Job not found." }
    const traveler = await getActiveTravelerByJobId(jobId)
    if (!traveler) {
      return { error: "No active traveler on this job." }
    }
    return { data: { traveler, jobNumber: job.jobNumber } }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load traveler for print"
    return { error: message }
  }
}

export async function getTravelerByIdAction(
  travelerId: string
): Promise<TravelerActionResult<Traveler | null>> {
  try {
    const ctx = await getSessionContext()
    if (!ctx) return { error: "Not signed in." }
    const traveler = await getTravelerById(travelerId)
    return { data: traveler }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load traveler"
    return { error: message }
  }
}
