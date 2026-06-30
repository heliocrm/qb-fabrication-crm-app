"use server"

import { revalidatePath } from "next/cache"
import { isDriveConfigured, isGoogleConfigured, requireDriveConfig } from "@/lib/google/config"
import {
  createDriveService,
  createDriveServiceIfConfigured,
  driveFolderUrl,
  isGoogleDriveFolderId,
  MAX_UPLOAD_BYTES,
} from "@/lib/google"
import { GoogleServiceError } from "@/lib/google/types"
import type { DriveFileMetadata as GoogleDriveFile } from "@/lib/google/types"
import { getJobById, updateJob } from "@/lib/supabase/services/jobs"
import {
  listDocumentsByJobId,
  syncDriveFileToDocument,
} from "@/lib/supabase/services/documents"
import { getUserProfile } from "@/lib/supabase/provision"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import type { Document } from "@/types"

type ActionResult<T> = { data?: T; error?: string }

function revalidateJob(jobId: string) {
  revalidatePath(`/jobs/${jobId}`)
  revalidatePath("/jobs")
}

async function safeDriveAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured" }
  }
  if (!isGoogleConfigured()) {
    return {
      error:
        "Google Workspace is not configured. Add service account credentials to .env.local.",
    }
  }

  try {
    const data = await fn()
    return { data }
  } catch (err) {
    const message =
      err instanceof GoogleServiceError
        ? err.message
        : err instanceof Error
          ? err.message
          : "An unexpected Google API error occurred"
    return { error: message }
  }
}

function driveFileToDocument(
  file: GoogleDriveFile,
  jobId: string,
  folderId: string
): Document {
  const docType = inferTypeFromName(file.name)
  return {
    id: file.id,
    jobId,
    name: file.name,
    type: docType,
    sizeBytes: file.sizeBytes,
    size: file.sizeBytes
      ? file.sizeBytes >= 1_048_576
        ? `${(file.sizeBytes / 1_048_576).toFixed(1)} MB`
        : `${(file.sizeBytes / 1024).toFixed(0)} KB`
      : undefined,
    mimeType: file.mimeType,
    googleDriveFileId: file.id,
    googleDriveFolderId: folderId,
    webViewLink: file.webViewLink,
    url: file.webViewLink ?? undefined,
    uploadedBy: "Google Drive",
    uploadedAt: file.modifiedTime ?? file.createdTime ?? new Date().toISOString(),
    preview:
      file.mimeType.startsWith("image/") || file.mimeType === "application/pdf",
  }
}

function inferTypeFromName(name: string): Document["type"] {
  if (/po/i.test(name)) return "PO"
  if (/draw|dwg|dxf|rev/i.test(name)) return "Drawing"
  if (/inspect|qc|weld|cert/i.test(name)) return "Inspection"
  if (/ship|bol/i.test(name)) return "Shipping"
  return "Work Order"
}

export async function getGoogleDriveStatusAction(): Promise<
  ActionResult<{ configured: boolean; driveReady: boolean }>
> {
  return {
    data: {
      configured: isGoogleConfigured(),
      driveReady: isDriveConfigured(),
    },
  }
}

export async function createJobDriveFolderAction(
  jobId: string
): Promise<ActionResult<{ folderId: string; webViewLink: string }>> {
  return safeDriveAction(async () => {
    if (!isDriveConfigured()) {
      throw new GoogleServiceError(
        "GOOGLE_DRIVE_JOBS_ROOT_FOLDER_ID is not set",
        "CONFIG"
      )
    }

    const job = await getJobById(jobId)
    if (!job) throw new GoogleServiceError("Job not found", "NOT_FOUND")

    if (isGoogleDriveFolderId(job.googleDriveFolderId)) {
      return {
        folderId: job.googleDriveFolderId!,
        webViewLink: driveFolderUrl(job.googleDriveFolderId!),
      }
    }

    const drive = await createDriveService()
    const config = requireDriveConfig()

    const folder = await drive.createJobFolder({
      jobNumber: job.jobNumber,
      poNumber: job.poNumber,
      customerName: job.customer,
      parentFolderId: config.driveJobsRootFolderId,
    })

    await updateJob(jobId, { google_drive_folder_id: folder.id })
    revalidateJob(jobId)

    return { folderId: folder.id, webViewLink: folder.webViewLink }
  })
}

export async function listJobDriveFilesAction(
  jobId: string
): Promise<ActionResult<{ files: Document[]; source: "drive" | "database" | "mock" }>> {
  if (!isSupabaseConfigured()) {
    return { data: { files: [], source: "mock" } }
  }

  const job = await getJobById(jobId)
  if (!job) return { error: "Job not found" }

  const folderId = job.googleDriveFolderId

  if (isDriveConfigured() && isGoogleDriveFolderId(folderId)) {
    let dbDocs: Document[] = []
    try {
      dbDocs = await listDocumentsByJobId(jobId)
    } catch {
      // continue with drive-only metadata
    }

    const dbByDriveId = new Map(
      dbDocs
        .filter((d) => d.googleDriveFileId)
        .map((d) => [d.googleDriveFileId!, d])
    )

    const driveResult = await safeDriveAction(async () => {
      const drive = await createDriveService()
      const files = await drive.listFolderFiles(folderId!)
      return files.map((f) => {
        const doc = driveFileToDocument(f, jobId, folderId!)
        const db = dbByDriveId.get(f.id)
        if (db) {
          return {
            ...doc,
            id: db.id,
            lineItemId: db.lineItemId ?? null,
            type: db.type,
            uploadedBy: db.uploadedBy,
            preview: db.preview,
          }
        }
        return doc
      })
    })

    if (driveResult.data) {
      // Include DB-only rows (e.g. pending sync) not yet in Drive listing
      const driveIds = new Set(driveResult.data.map((d) => d.googleDriveFileId).filter(Boolean))
      const dbOnly = dbDocs.filter(
        (d) => d.googleDriveFileId && !driveIds.has(d.googleDriveFileId)
      )
      return { data: { files: [...driveResult.data, ...dbOnly], source: "drive" } }
    }
  }

  try {
    const docs = await listDocumentsByJobId(jobId)
    if (docs.length > 0) {
      return { data: { files: docs, source: "database" } }
    }
  } catch {
    // fall through to mock documents on job
  }

  return { data: { files: job.documents, source: "mock" } }
}

export async function uploadJobDriveFileAction(
  jobId: string,
  formData: FormData,
  lineItemId?: string | null
): Promise<ActionResult<{ document: Document }>> {
  return safeDriveAction(async () => {
    const file = formData.get("file")
    if (!(file instanceof File)) {
      throw new GoogleServiceError("No file provided", "VALIDATION")
    }

    const scopeLineItemId = lineItemId ?? (formData.get("lineItemId") as string | null) ?? null

    if (file.size > MAX_UPLOAD_BYTES) {
      throw new GoogleServiceError("File exceeds 50 MB limit", "VALIDATION")
    }

    const job = await getJobById(jobId)
    if (!job) throw new GoogleServiceError("Job not found", "NOT_FOUND")

    let folderId = job.googleDriveFolderId

    if (!isGoogleDriveFolderId(folderId)) {
      const created = await createJobDriveFolderAction(jobId)
      if (created.error || !created.data) {
        throw new GoogleServiceError(
          created.error ?? "Failed to create Drive folder",
          "FOLDER"
        )
      }
      folderId = created.data.folderId
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const drive = await createDriveService()
    const uploaded = await drive.uploadFile({
      folderId: folderId!,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      buffer,
    })

    const profile = await getUserProfile()
    const uploadedBy = profile?.name ?? "Team Member"

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
        documentType: uploaded.documentType,
      },
      uploadedBy,
      scopeLineItemId || null
    )

    revalidateJob(jobId)
    return { document }
  })
}

export async function getDriveFileLinksAction(
  fileId: string,
  mimeType?: string
): Promise<
  ActionResult<{
    webViewLink: string
    previewLink: string
    thumbnailLink: string
  }>
> {
  return safeDriveAction(async () => {
    const drive = await createDriveServiceIfConfigured()
    if (!drive) throw new GoogleServiceError("Drive not configured", "CONFIG")
    return drive.getShareLinks(fileId, mimeType)
  })
}
