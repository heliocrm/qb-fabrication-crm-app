import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
  type TypedSupabaseClient,
} from "@/lib/supabase/schema"
import { mapChangeOrderRow } from "@/lib/supabase/mappers"
import type {
  ChangeOrder,
  ChangeOrderInsert,
  ChangeOrderRow,
  ChangeOrderType,
} from "@/types"

async function getClient(): Promise<TypedSupabaseClient> {
  return createClient()
}

export async function createChangeOrder(
  jobId: string,
  input: {
    type: ChangeOrderType
    description: string
    impact?: string | null
    value?: number | null
    status?: ChangeOrderInsert["status"]
    occurredOn?: string
  }
): Promise<ChangeOrder> {
  const supabase = await getClient()
  const organizationId = await requireOrganizationId(supabase)

  const { data: sessionData } = await supabase.auth.getUser()
  const createdBy = sessionData.user?.id ?? null

  const { data, error } = await supabase
    .from(Tables.change_orders)
    .insert({
      organization_id: organizationId,
      job_id: jobId,
      type: input.type,
      description: input.description.trim(),
      impact: input.impact?.trim() || null,
      value: input.value ?? null,
      status: input.status ?? "Open",
      occurred_on: input.occurredOn ?? new Date().toISOString().slice(0, 10),
      created_by: createdBy,
    })
    .select("*")
    .single()

  const row = throwOnError({ data, error }) as ChangeOrderRow
  return mapChangeOrderRow(row)
}
