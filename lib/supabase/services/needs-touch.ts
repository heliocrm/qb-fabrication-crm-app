import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
} from "@/lib/supabase/schema"
import type { Contact, ContactRow } from "@/types"

const DORMANT_DAYS = 90

export type NeedsTouchReason = "next_touch_due" | "dormant"

export interface NeedsTouchRow {
  contact: Contact
  accountName: string
  accountId: string
  reason: NeedsTouchReason
  openJobCount: number
}

function mapContactRow(row: ContactRow): Contact {
  return {
    id: row.id,
    organizationId: row.organization_id,
    accountId: row.account_id,
    fullName: row.full_name,
    roleTitle: row.role_title ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    preferredChannel: row.preferred_channel ?? "",
    personalNotes: row.personal_notes ?? "",
    relationshipOwnerId: row.relationship_owner_id,
    lastContactAt: row.last_contact_at,
    nextTouchAt: row.next_touch_at,
    nextTouchOwnerId: row.next_touch_owner_id,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function startOfTodayIso(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function dormantCutoffIso(): string {
  const d = new Date()
  d.setDate(d.getDate() - DORMANT_DAYS)
  return d.toISOString()
}

/**
 * Contacts needing a touch:
 * - next_touch_at <= today, OR
 * - last_contact_at older than 90 days (when set) and no future next_touch
 */
export async function listNeedsTouchContacts(input: {
  profileId: string
  scope: "mine" | "all"
}): Promise<NeedsTouchRow[]> {
  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)
  const today = startOfTodayIso()
  const dormantBefore = dormantCutoffIso()

  let query = supabase
    .from(Tables.contacts)
    .select(
      `
      *,
      accounts:account_id ( id, name )
    `
    )
    .eq("organization_id", organizationId)

  if (input.scope === "mine") {
    query = query.or(
      `relationship_owner_id.eq.${input.profileId},next_touch_owner_id.eq.${input.profileId}`
    )
  }

  const { data, error } = await query.order("next_touch_at", {
    ascending: true,
    nullsFirst: false,
  })

  throwOnError({ data, error })

  type Row = ContactRow & {
    accounts?: { id: string; name: string } | null
  }

  const candidates = ((data ?? []) as unknown as Row[]).filter((row) => {
    const next = row.next_touch_at
    if (next && new Date(next).getTime() <= new Date(today).getTime()) {
      return true
    }
    if (next && new Date(next).getTime() > Date.now()) {
      return false
    }
    if (
      row.last_contact_at &&
      new Date(row.last_contact_at).getTime() < new Date(dormantBefore).getTime()
    ) {
      return true
    }
    return false
  })

  const accountIds = [
    ...new Set(candidates.map((c) => c.account_id as string)),
  ]

  const openJobCounts = new Map<string, number>()
  if (accountIds.length > 0) {
    const { data: jobs } = await supabase
      .from(Tables.jobs)
      .select("id, account_id, status")
      .eq("organization_id", organizationId)
      .in("account_id", accountIds)
      .neq("status", "Delivered")

    for (const j of jobs ?? []) {
      const aid = j.account_id as string
      openJobCounts.set(aid, (openJobCounts.get(aid) ?? 0) + 1)
    }
  }

  return candidates.map((row) => {
    const next = row.next_touch_at
    const reason: NeedsTouchReason =
      next && new Date(next).getTime() <= new Date(today).getTime()
        ? "next_touch_due"
        : "dormant"

    return {
      contact: mapContactRow(row),
      accountName: row.accounts?.name ?? "Account",
      accountId: row.account_id,
      reason,
      openJobCount: openJobCounts.get(row.account_id) ?? 0,
    }
  })
}
