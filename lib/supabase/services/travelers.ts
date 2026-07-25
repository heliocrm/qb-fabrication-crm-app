import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
  type TypedSupabaseClient,
} from "@/lib/supabase/schema"
import type { TravelerGeneration } from "@/lib/travelers/types"
import type {
  Traveler,
  TravelerGenerationRow,
  TravelerImportFields,
  TravelerLine,
  TravelerLineRow,
  TravelerRow,
} from "@/types"
import { createLineItemWithTemplateTasks } from "@/lib/supabase/services/line-items"
import type { JobTemplateType } from "@/types"

async function getClient(): Promise<TypedSupabaseClient> {
  return createClient()
}

function mapGenerationRow(
  row: TravelerGenerationRow & {
    documents?: { name: string | null; web_view_link: string | null } | null
  }
): TravelerGeneration {
  return {
    id: row.id,
    organizationId: row.organization_id,
    jobId: row.job_id,
    poNumber: row.po_number,
    version: row.version,
    customer: row.customer,
    orderDate: row.order_date,
    revNumber: row.rev_number,
    structureNumbers: row.structure_numbers,
    catalogIds: row.catalog_ids,
    documentId: row.document_id,
    generatedBy: row.generated_by,
    generatedAt: row.generated_at,
    webViewLink: row.documents?.web_view_link ?? null,
    documentName: row.documents?.name ?? null,
  }
}

function mapLineRow(row: TravelerLineRow): TravelerLine {
  return {
    id: row.id,
    organizationId: row.organization_id,
    travelerId: row.traveler_id,
    jobId: row.job_id,
    lineNumber: row.line_number,
    quantity: Number(row.quantity) || 1,
    catalogId: row.catalog_id,
    description: row.description,
    structureNumber: row.structure_number,
    lineItemId: row.line_item_id,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapTravelerRow(
  row: TravelerRow,
  lines: TravelerLineRow[] = []
): Traveler {
  return {
    id: row.id,
    organizationId: row.organization_id,
    jobId: row.job_id,
    poNumber: row.po_number,
    customer: row.customer,
    orderDate: row.order_date,
    revNumber: row.rev_number,
    qbSalesOrder: row.qb_sales_order,
    shipDate: row.ship_date,
    sourceDocumentId: row.source_document_id,
    version: row.version,
    status: row.status,
    importedBy: row.imported_by,
    importedAt: row.imported_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lines: lines
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapLineRow),
  }
}

export async function getNextTravelerVersion(
  jobId: string,
  poNumber: string
): Promise<number> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.traveler_generations)
    .select("version")
    .eq("job_id", jobId)
    .eq("po_number", poNumber)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throwOnError({ data: null, error })
  return (data?.version ?? 0) + 1
}

export async function getNextDigitalTravelerVersion(
  jobId: string,
  poNumber: string
): Promise<number> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.travelers)
    .select("version")
    .eq("job_id", jobId)
    .eq("po_number", poNumber)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throwOnError({ data: null, error })
  return (data?.version ?? 0) + 1
}

export async function listTravelerGenerationsByJobId(
  jobId: string
): Promise<TravelerGeneration[]> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.traveler_generations)
    .select("*, documents:document_id ( name, web_view_link )")
    .eq("job_id", jobId)
    .order("generated_at", { ascending: false })

  throwOnError({ data, error })
  return ((data ?? []) as TravelerGenerationRow[]).map((row) =>
    mapGenerationRow(
      row as TravelerGenerationRow & {
        documents?: { name: string | null; web_view_link: string | null } | null
      }
    )
  )
}

export async function insertTravelerGeneration(input: {
  jobId: string
  poNumber: string
  version: number
  customer: string | null
  orderDate: string | null
  revNumber: string | null
  structureNumbers: string | null
  catalogIds: string | null
  documentId: string | null
  generatedBy: string | null
}): Promise<TravelerGeneration> {
  const supabase = await getClient()
  const organizationId = await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.traveler_generations)
    .insert({
      organization_id: organizationId,
      job_id: input.jobId,
      po_number: input.poNumber,
      version: input.version,
      customer: input.customer,
      order_date: input.orderDate,
      rev_number: input.revNumber,
      structure_numbers: input.structureNumbers,
      catalog_ids: input.catalogIds,
      document_id: input.documentId,
      generated_by: input.generatedBy,
    })
    .select("*")
    .single()

  throwOnError({ data, error })
  return mapGenerationRow(data as TravelerGenerationRow)
}

export async function getActiveTravelerByJobId(
  jobId: string
): Promise<Traveler | null> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.travelers)
    .select("*")
    .eq("job_id", jobId)
    .eq("status", "active")
    .order("imported_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throwOnError({ data: null, error })
  if (!data) return null

  const { data: lineRows, error: lineError } = await supabase
    .from(Tables.traveler_lines)
    .select("*")
    .eq("traveler_id", data.id)
    .order("sort_order", { ascending: true })

  throwOnError({ data: lineRows, error: lineError })
  return mapTravelerRow(data as TravelerRow, (lineRows ?? []) as TravelerLineRow[])
}

export async function listTravelersByJobId(jobId: string): Promise<Traveler[]> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.travelers)
    .select("*")
    .eq("job_id", jobId)
    .order("imported_at", { ascending: false })

  throwOnError({ data, error })
  const headers = (data ?? []) as TravelerRow[]
  if (!headers.length) return []

  const ids = headers.map((h) => h.id)
  const { data: lineRows, error: lineError } = await supabase
    .from(Tables.traveler_lines)
    .select("*")
    .in("traveler_id", ids)
    .order("sort_order", { ascending: true })

  throwOnError({ data: lineRows, error: lineError })
  const byTraveler = new Map<string, TravelerLineRow[]>()
  for (const row of (lineRows ?? []) as TravelerLineRow[]) {
    const list = byTraveler.get(row.traveler_id) ?? []
    list.push(row)
    byTraveler.set(row.traveler_id, list)
  }

  return headers.map((h) => mapTravelerRow(h, byTraveler.get(h.id) ?? []))
}

export async function getTravelerById(id: string): Promise<Traveler | null> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.travelers)
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throwOnError({ data: null, error })
  if (!data) return null

  const { data: lineRows, error: lineError } = await supabase
    .from(Tables.traveler_lines)
    .select("*")
    .eq("traveler_id", data.id)
    .order("sort_order", { ascending: true })

  throwOnError({ data: lineRows, error: lineError })
  return mapTravelerRow(data as TravelerRow, (lineRows ?? []) as TravelerLineRow[])
}

export async function supersedeActiveTravelers(
  jobId: string,
  poNumber: string
): Promise<void> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { error } = await supabase
    .from(Tables.travelers)
    .update({ status: "superseded", updated_at: new Date().toISOString() })
    .eq("job_id", jobId)
    .eq("po_number", poNumber)
    .eq("status", "active")

  if (error) throwOnError({ data: null, error })
}

export async function importDigitalTraveler(input: {
  jobId: string
  fields: TravelerImportFields
  jobTemplate: JobTemplateType | null | undefined
  importedBy: string | null
  sourceDocumentId?: string | null
}): Promise<Traveler> {
  const supabase = await getClient()
  const organizationId = await requireOrganizationId(supabase)
  const { jobId, fields, importedBy } = input
  const customerPo = fields.customerPo.trim()
  const version = await getNextDigitalTravelerVersion(jobId, customerPo)

  await supersedeActiveTravelers(jobId, customerPo)

  const { data: header, error: headerError } = await supabase
    .from(Tables.travelers)
    .insert({
      organization_id: organizationId,
      job_id: jobId,
      po_number: customerPo,
      customer: fields.customer?.trim() || null,
      order_date: fields.orderDate?.trim() || null,
      rev_number: fields.revNumber?.trim() || "0",
      qb_sales_order: fields.qbSalesOrder?.trim() || null,
      ship_date: fields.shipDate?.trim() || null,
      source_document_id: input.sourceDocumentId ?? null,
      version,
      status: "active",
      imported_by: importedBy,
    })
    .select("*")
    .single()

  throwOnError({ data: header, error: headerError })
  const travelerRow = header as TravelerRow

  const template: JobTemplateType = input.jobTemplate ?? "qb_project"
  const lineRows: TravelerLineRow[] = []

  for (let i = 0; i < fields.catalogItems.length; i++) {
    const item = fields.catalogItems[i]!
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1
    const title =
      item.description?.trim() && item.description.trim() !== "N/A"
        ? item.description.trim().slice(0, 200)
        : item.catalogId.trim() || `Line ${i + 1}`

    const lineItem = await createLineItemWithTemplateTasks(jobId, template, {
      title,
      quantity: qty,
      lineItemNumber: item.lineNumber?.trim() || String(i + 1),
      wipStatus: "To Do",
      description: item.description?.trim() || undefined,
      sortOrder: i,
    })

    const { data: lineRow, error: lineError } = await supabase
      .from(Tables.traveler_lines)
      .insert({
        organization_id: organizationId,
        traveler_id: travelerRow.id,
        job_id: jobId,
        line_number: item.lineNumber?.trim() || String(i + 1),
        quantity: qty,
        catalog_id: item.catalogId.trim(),
        description: item.description?.trim() || null,
        structure_number: item.structureNumber?.trim() || null,
        line_item_id: lineItem.id,
        sort_order: i,
      })
      .select("*")
      .single()

    throwOnError({ data: lineRow, error: lineError })
    lineRows.push(lineRow as TravelerLineRow)
  }

  return mapTravelerRow(travelerRow, lineRows)
}

export async function updateTravelerLine(
  lineId: string,
  updates: {
    structureNumber?: string
    description?: string
    catalogId?: string
    quantity?: number
  }
): Promise<TravelerLine> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.traveler_lines)
    .update({
      updated_at: new Date().toISOString(),
      ...(updates.structureNumber !== undefined
        ? { structure_number: updates.structureNumber }
        : {}),
      ...(updates.description !== undefined
        ? { description: updates.description }
        : {}),
      ...(updates.catalogId !== undefined
        ? { catalog_id: updates.catalogId }
        : {}),
      ...(updates.quantity !== undefined ? { quantity: updates.quantity } : {}),
    })
    .eq("id", lineId)
    .select("*")
    .single()

  throwOnError({ data, error })
  return mapLineRow(data as TravelerLineRow)
}
