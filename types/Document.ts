import type { DocumentType } from "./enums"

/** Domain model — used by UI and mock data */
export interface Document {
  id: string
  jobId?: string
  name: string
  type: DocumentType
  /** Human-readable size, e.g. "4.2 MB" — UI only; prefer sizeBytes in DB */
  size?: string
  sizeBytes?: number | null
  mimeType?: string | null
  /** Google Drive file ID (e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms) */
  googleDriveFileId?: string | null
  /** Google Drive folder ID for the job's root folder */
  googleDriveFolderId?: string | null
  /** Supabase Storage path when not using Drive */
  storagePath?: string | null
  /** Direct web view link (Drive or signed URL) */
  webViewLink?: string | null
  /** Legacy mock field — maps to webViewLink */
  url?: string
  uploadedBy: string
  uploadedById?: string | null
  uploadedAt: string
  preview?: boolean
  createdAt?: string
  updatedAt?: string
}

/** Supabase `documents` table row (snake_case) */
export interface DocumentRow {
  id: string
  organization_id: string
  job_id: string
  name: string
  type: DocumentType
  mime_type: string | null
  size_bytes: number | null
  google_drive_file_id: string | null
  google_drive_folder_id: string | null
  storage_path: string | null
  web_view_link: string | null
  preview_enabled: boolean
  uploaded_by: string | null
  uploaded_by_id: string | null
  created_at: string
  updated_at: string
}

export interface DocumentInsert {
  organization_id: string
  job_id: string
  name: string
  type: DocumentType
  mime_type?: string | null
  size_bytes?: number | null
  google_drive_file_id?: string | null
  google_drive_folder_id?: string | null
  storage_path?: string | null
  web_view_link?: string | null
  preview_enabled?: boolean
  uploaded_by?: string | null
  uploaded_by_id?: string | null
}

export type DocumentUpdate = Partial<
  Omit<DocumentInsert, "organization_id" | "job_id">
>
