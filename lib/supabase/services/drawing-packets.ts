import { createClient } from "@/lib/supabase/server"
import { getSessionContext } from "@/lib/auth/session"
import { Tables, throwOnError } from "@/lib/supabase/schema"
import type { CropTemplateData } from "@/lib/drawing-packet/stamp-engine"

export type DrawingCropTemplateRow = {
  id: string
  organizationId: string
  name: string
  crop: [number, number, number, number]
  marginSide: "left" | "right"
  marginLeft: number
  marginRight: number
}

type TemplateDbRow = {
  id: string
  organization_id: string
  name: string
  crop_x0: number
  crop_y0: number
  crop_x1: number
  crop_y1: number
  margin_side: string
  margin_left: number
  margin_right: number
}

function mapTemplate(row: TemplateDbRow): DrawingCropTemplateRow {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    crop: [row.crop_x0, row.crop_y0, row.crop_x1, row.crop_y1],
    marginSide: row.margin_side === "right" ? "right" : "left",
    marginLeft: row.margin_left,
    marginRight: row.margin_right,
  }
}

/** Untyped until Database types include migration 022 tables. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db(): Promise<any> {
  return createClient()
}

export async function listDrawingCropTemplates(): Promise<
  DrawingCropTemplateRow[]
> {
  const ctx = await getSessionContext()
  if (!ctx) return []
  const supabase = await db()
  const { data, error } = await supabase
    .from(Tables.drawing_crop_templates)
    .select("*")
    .eq("organization_id", ctx.organizationId)
    .order("name")
  if (error) throwOnError({ data: null, error })
  return ((data ?? []) as TemplateDbRow[]).map(mapTemplate)
}

export async function upsertDrawingCropTemplate(input: {
  name: string
  data: CropTemplateData
}): Promise<DrawingCropTemplateRow> {
  const ctx = await getSessionContext()
  if (!ctx) throw new Error("Not signed in")
  const supabase = await db()
  const [x0, y0, x1, y1] = input.data.crop
  const { data, error } = await supabase
    .from(Tables.drawing_crop_templates)
    .upsert(
      {
        organization_id: ctx.organizationId,
        name: input.name.trim(),
        crop_x0: x0,
        crop_y0: y0,
        crop_x1: x1,
        crop_y1: y1,
        margin_side: input.data.marginSide,
        margin_left: input.data.marginLeft,
        margin_right: input.data.marginRight,
        created_by: ctx.profileId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,name" }
    )
    .select("*")
    .single()
  return mapTemplate(throwOnError({ data, error }) as TemplateDbRow)
}

export async function deleteDrawingCropTemplate(name: string): Promise<void> {
  const ctx = await getSessionContext()
  if (!ctx) throw new Error("Not signed in")
  const supabase = await db()
  const { error } = await supabase
    .from(Tables.drawing_crop_templates)
    .delete()
    .eq("organization_id", ctx.organizationId)
    .eq("name", name)
  if (error) throwOnError({ data: null, error })
}

export async function insertDrawingPacket(input: {
  jobId: string
  travelerId?: string | null
  documentId?: string | null
  poNumber?: string | null
  revNumber?: string | null
  pageCount?: number | null
}): Promise<void> {
  const ctx = await getSessionContext()
  if (!ctx) return
  const supabase = await db()
  await supabase.from(Tables.drawing_packets).insert({
    organization_id: ctx.organizationId,
    job_id: input.jobId,
    traveler_id: input.travelerId ?? null,
    document_id: input.documentId ?? null,
    po_number: input.poNumber ?? null,
    rev_number: input.revNumber ?? null,
    page_count: input.pageCount ?? null,
    created_by: ctx.profileId,
  })
}
