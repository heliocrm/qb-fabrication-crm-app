import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
  type TypedSupabaseClient,
} from "@/lib/supabase/schema"
import type { TravelerGeneration } from "@/lib/travelers/types"
import type { TravelerGenerationRow } from "@/types"

async function getClient(): Promise<TypedSupabaseClient> {
  return createClient()
}

function mapRow(
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
    mapRow(row as TravelerGenerationRow & {
      documents?: { name: string | null; web_view_link: string | null } | null
    })
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
  return mapRow(data as TravelerGenerationRow)
}
