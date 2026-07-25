import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
} from "@/lib/supabase/schema"
import { listContactsByAccountId } from "@/lib/supabase/services/contacts"
import { createCrmTask } from "@/lib/supabase/services/crm-tasks"
import type { CrmTask } from "@/types"

/** Stable title prefix — used for idempotency (one check-in follow-up per job). */
export const DELIVERED_CHECKIN_TITLE_PREFIX = "30-day check-in — "

export function deliveredCheckInTitle(jobNumber: string): string {
  return `${DELIVERED_CHECKIN_TITLE_PREFIX}${jobNumber}`
}

function dueInThirtyDaysIso(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString()
}

/**
 * When a job first becomes Delivered, create one CRM follow-up for a 30-day
 * relationship check-in. Idempotent: never creates a second row for the same job
 * with this title prefix (even if the first was completed).
 *
 * Soft-fail friendly: callers should catch errors so job status updates still succeed.
 */
export async function ensureDeliveredCheckInFollowUp(input: {
  jobId: string
  jobNumber: string
  accountId?: string | null
  actorProfileId: string
}): Promise<CrmTask | null> {
  const accountId = input.accountId?.trim() || null
  if (!accountId) return null

  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const title = deliveredCheckInTitle(input.jobNumber)

  const { data: existing, error: existingError } = await supabase
    .from(Tables.crm_tasks)
    .select("id")
    .eq("job_id", input.jobId)
    .like("title", `${DELIVERED_CHECKIN_TITLE_PREFIX}%`)
    .limit(1)
    .maybeSingle()

  if (existingError) {
    throwOnError({ data: null, error: existingError })
  }
  if (existing) return null

  const contacts = await listContactsByAccountId(accountId)
  const primary =
    contacts.find((c) => c.isPrimary) ?? contacts[0] ?? null
  const ownerId =
    primary?.relationshipOwnerId?.trim() || input.actorProfileId

  return createCrmTask({
    title,
    body: `Check in after delivery of ${input.jobNumber}. Ask about satisfaction and any follow-on work.`,
    dueAt: dueInThirtyDaysIso(),
    ownerId,
    createdBy: input.actorProfileId,
    accountId,
    contactId: primary?.id ?? null,
    jobId: input.jobId,
  })
}
