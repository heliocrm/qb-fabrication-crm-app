import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
  type TypedSupabaseClient,
} from "@/lib/supabase/schema"
import { mapDocumentRow } from "@/lib/supabase/mappers"
import type { Document, DocumentInsert, DocumentRow } from "@/types"

async function getClient(): Promise<TypedSupabaseClient> {
  return createClient()
}

export async function listDocumentsByJobId(jobId: string): Promise<Document[]> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.documents)
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })

  throwOnError({ data, error })
  return ((data ?? []) as DocumentRow[]).map(mapDocumentRow)
}

export async function upsertDocumentFromDrive(
  input: Omit<DocumentInsert, "organization_id"> & { organization_id?: string }
): Promise<Document> {
  const supabase = await getClient()
  const organizationId =
    input.organization_id ?? (await requireOrganizationId(supabase))

  const payload: DocumentInsert = {
    ...input,
    organization_id: organizationId,
  }

  const { data, error } = await supabase
    .from(Tables.documents)
    .insert(payload)
    .select("*")
    .single()

  throwOnError({ data, error })
  return mapDocumentRow(data as DocumentRow)
}

export async function syncDriveFileToDocument(
  jobId: string,
  file: {
    id: string
    name: string
    mimeType: string
    sizeBytes?: number | null
    webViewLink?: string | null
    thumbnailLink?: string | null
    folderId?: string | null
    documentType: string
  },
  uploadedBy: string,
  lineItemId?: string | null
): Promise<Document> {
  return upsertDocumentFromDrive({
    job_id: jobId,
    line_item_id: lineItemId ?? null,
    name: file.name,
    type: file.documentType as Document["type"],
    mime_type: file.mimeType,
    size_bytes: file.sizeBytes ?? null,
    google_drive_file_id: file.id,
    google_drive_folder_id: file.folderId ?? null,
    web_view_link: file.webViewLink ?? null,
    preview_enabled: file.mimeType.startsWith("image/") || file.mimeType === "application/pdf",
    uploaded_by: uploadedBy,
  })
}
