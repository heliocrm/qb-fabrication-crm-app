import type { TravelerGeneration } from "@/lib/travelers/types"

/** Supabase `traveler_generations` table row */
export interface TravelerGenerationRow {
  id: string
  organization_id: string
  job_id: string
  po_number: string
  version: number
  customer: string | null
  order_date: string | null
  rev_number: string | null
  structure_numbers: string | null
  catalog_ids: string | null
  document_id: string | null
  generated_by: string | null
  generated_at: string
}

export type { TravelerGeneration }
