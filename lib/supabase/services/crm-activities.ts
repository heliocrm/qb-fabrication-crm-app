import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
} from "@/lib/supabase/schema"
import { resolveAccountId, resolveJobId } from "@/lib/seed-ids"
import type { CrmActivity, CrmActivityKind, CrmActivityRow } from "@/types"

type ActivityListRow = CrmActivityRow & {
  profiles?: { full_name: string | null } | null
}

function mapActivityRow(row: ActivityListRow): CrmActivity {
  return {
    id: row.id,
    organizationId: row.organization_id,
    accountId: row.account_id,
    contactId: row.contact_id,
    jobId: row.job_id,
    kind: row.kind,
    body: row.body,
    occurredAt: row.occurred_at,
    createdBy: row.created_by,
    createdByName: row.profiles?.full_name ?? null,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  }
}

const ACTIVITY_SELECT = `
  *,
  profiles:created_by ( full_name )
` as const

export async function listCrmActivitiesForAccount(
  accountId: string
): Promise<CrmActivity[]> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)
  const resolved = resolveAccountId(accountId)

  const { data: contactRows, error: contactError } = await supabase
    .from(Tables.contacts)
    .select("id")
    .eq("account_id", resolved)

  throwOnError({ data: contactRows, error: contactError })
  const contactIds = (contactRows ?? []).map((c) => c.id as string)

  // Account-level notes + notes on any contact under the account
  let query = supabase
    .from(Tables.crm_activities)
    .select(ACTIVITY_SELECT)
    .order("occurred_at", { ascending: false })
    .limit(100)

  if (contactIds.length > 0) {
    query = query.or(
      `account_id.eq.${resolved},contact_id.in.(${contactIds.join(",")})`
    )
  } else {
    query = query.eq("account_id", resolved)
  }

  const { data, error } = await query
  throwOnError({ data, error })
  return ((data ?? []) as unknown as ActivityListRow[]).map(mapActivityRow)
}

export async function listCrmActivitiesForJob(
  jobId: string
): Promise<CrmActivity[]> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)
  const resolved = resolveJobId(jobId)

  const { data, error } = await supabase
    .from(Tables.crm_activities)
    .select(ACTIVITY_SELECT)
    .eq("job_id", resolved)
    .order("occurred_at", { ascending: false })
    .limit(100)

  throwOnError({ data, error })
  return ((data ?? []) as unknown as ActivityListRow[]).map(mapActivityRow)
}

export async function createCrmActivity(input: {
  accountId?: string | null
  contactId?: string | null
  jobId?: string | null
  kind?: CrmActivityKind
  body: string
  occurredAt?: string
  createdBy: string
}): Promise<CrmActivity> {
  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)

  const accountId = input.accountId
    ? resolveAccountId(input.accountId)
    : null
  const jobId = input.jobId ? resolveJobId(input.jobId) : null

  if (!accountId && !input.contactId && !jobId) {
    throw new Error("Activity must link to an account, contact, or job")
  }

  const { data, error } = await supabase
    .from(Tables.crm_activities)
    .insert({
      organization_id: organizationId,
      account_id: accountId,
      contact_id: input.contactId ?? null,
      job_id: jobId,
      kind: input.kind ?? "note",
      body: input.body.trim(),
      occurred_at: input.occurredAt ?? new Date().toISOString(),
      created_by: input.createdBy,
      metadata: {},
    })
    .select(ACTIVITY_SELECT)
    .single()

  const row = throwOnError({ data, error }) as unknown as ActivityListRow
  return mapActivityRow(row)
}
