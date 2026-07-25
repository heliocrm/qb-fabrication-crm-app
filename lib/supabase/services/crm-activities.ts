import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
} from "@/lib/supabase/schema"
import { resolveAccountId, resolveJobId } from "@/lib/seed-ids"
import type { CrmActivity, CrmActivityKind, CrmActivityRow } from "@/types"
import type { Json } from "@/types/database"

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
    externalSource: row.external_source ?? null,
    externalId: row.external_id ?? null,
    createdAt: row.created_at,
  }
}

const ACTIVITY_SELECT = `
  *,
  profiles:created_by ( full_name )
` as const

async function touchContactAfterActivity(
  contactId: string | null | undefined,
  occurredAt: string
): Promise<void> {
  if (!contactId) return
  const supabase = await createClient()
  const { data: contact } = await supabase
    .from(Tables.contacts)
    .select("last_contact_at, next_touch_at")
    .eq("id", contactId)
    .maybeSingle()

  if (!contact) return

  const updates: {
    last_contact_at?: string
    next_touch_at?: string | null
  } = {}

  const prev = contact.last_contact_at as string | null
  if (!prev || new Date(prev).getTime() < new Date(occurredAt).getTime()) {
    updates.last_contact_at = occurredAt
  }

  const nextTouch = contact.next_touch_at as string | null
  if (nextTouch && new Date(nextTouch).getTime() <= Date.now()) {
    updates.next_touch_at = null
  }

  if (Object.keys(updates).length === 0) return
  await supabase.from(Tables.contacts).update(updates).eq("id", contactId)
}

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
  metadata?: Record<string, unknown>
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

  const occurredAt = input.occurredAt ?? new Date().toISOString()

  const { data, error } = await supabase
    .from(Tables.crm_activities)
    .insert({
      organization_id: organizationId,
      account_id: accountId,
      contact_id: input.contactId ?? null,
      job_id: jobId,
      kind: input.kind ?? "note",
      body: input.body.trim(),
      occurred_at: occurredAt,
      created_by: input.createdBy,
      metadata: (input.metadata ?? {}) as Json,
    })
    .select(ACTIVITY_SELECT)
    .single()

  const row = throwOnError({ data, error }) as unknown as ActivityListRow
  await touchContactAfterActivity(input.contactId, occurredAt)
  return mapActivityRow(row)
}

/** Upsert synced Gmail/Calendar rows by (org, external_source, external_id) */
export async function upsertExternalCrmActivity(input: {
  accountId?: string | null
  contactId?: string | null
  jobId?: string | null
  kind: CrmActivityKind
  body: string
  occurredAt: string
  createdBy: string
  externalSource: string
  externalId: string
  metadata?: Record<string, unknown>
}): Promise<CrmActivity> {
  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)

  const accountId = input.accountId
    ? resolveAccountId(input.accountId)
    : null
  const jobId = input.jobId ? resolveJobId(input.jobId) : null

  const { data: existing } = await supabase
    .from(Tables.crm_activities)
    .select("id")
    .eq("organization_id", organizationId)
    .eq("external_source", input.externalSource)
    .eq("external_id", input.externalId)
    .maybeSingle()

  if (existing?.id) {
    const { data, error } = await supabase
      .from(Tables.crm_activities)
      .update({
        account_id: accountId,
        contact_id: input.contactId ?? null,
        job_id: jobId,
        kind: input.kind,
        body: input.body.trim(),
        occurred_at: input.occurredAt,
        metadata: (input.metadata ?? {}) as Json,
      })
      .eq("id", existing.id)
      .select(ACTIVITY_SELECT)
      .single()

    const row = throwOnError({ data, error }) as unknown as ActivityListRow
    await touchContactAfterActivity(input.contactId, input.occurredAt)
    return mapActivityRow(row)
  }

  const { data, error } = await supabase
    .from(Tables.crm_activities)
    .insert({
      organization_id: organizationId,
      account_id: accountId,
      contact_id: input.contactId ?? null,
      job_id: jobId,
      kind: input.kind,
      body: input.body.trim(),
      occurred_at: input.occurredAt,
      created_by: input.createdBy,
      metadata: (input.metadata ?? {}) as Json,
      external_source: input.externalSource,
      external_id: input.externalId,
    })
    .select(ACTIVITY_SELECT)
    .single()

  const row = throwOnError({ data, error }) as unknown as ActivityListRow
  await touchContactAfterActivity(input.contactId, input.occurredAt)
  return mapActivityRow(row)
}
