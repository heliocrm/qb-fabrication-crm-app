import { createClient } from "@/lib/supabase/server"
import {
  OPPORTUNITY_LIST_SELECT,
  Tables,
  requireOrganizationId,
  SupabaseServiceError,
  throwOnError,
  type TypedSupabaseClient,
} from "@/lib/supabase/schema"
import { mapOpportunityRow } from "@/lib/supabase/mappers"
import { ALL_STAGES } from "@/lib/opportunities-config"
import type { Opportunity, OpportunityRow, OppStage } from "@/types"

type OpportunityListRow = OpportunityRow & {
  accounts: { id: string; name: string; short_name: string } | null
}

async function getClient(): Promise<TypedSupabaseClient> {
  return createClient()
}

function probabilityForStage(stage: OppStage, current: number): number {
  if (stage === "Won") return 100
  if (stage === "Lost") return 0
  return current
}

/** List opportunities with account relation for customer name */
export async function listOpportunities(): Promise<Opportunity[]> {
  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.opportunities)
    .select(OPPORTUNITY_LIST_SELECT)
    .order("close_date", { ascending: true, nullsFirst: false })

  throwOnError({ data, error })

  return ((data ?? []) as unknown as OpportunityListRow[]).map(mapOpportunityRow)
}

/** Update pipeline stage; adjusts probability for Won/Lost */
export async function updateOpportunityStage(
  id: string,
  stage: OppStage
): Promise<Opportunity> {
  if (!ALL_STAGES.includes(stage)) {
    throw new Error(`Invalid stage: ${stage}`)
  }

  const supabase = await getClient()
  await requireOrganizationId(supabase)

  const { data: existing, error: fetchError } = await supabase
    .from(Tables.opportunities)
    .select("probability")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    throw new SupabaseServiceError(fetchError.message, fetchError.code, fetchError.details)
  }
  if (!existing) {
    throw new Error("Opportunity not found")
  }

  const probability = probabilityForStage(stage, existing.probability)

  const { data, error } = await supabase
    .from(Tables.opportunities)
    .update({ stage, probability })
    .eq("id", id)
    .select(OPPORTUNITY_LIST_SELECT)
    .single()

  throwOnError({ data, error })
  return mapOpportunityRow(data as unknown as OpportunityListRow)
}
