import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
} from "@/lib/supabase/schema"
import { resolveAccountId } from "@/lib/seed-ids"
import type { Contact, ContactRow } from "@/types"

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

async function ensurePrimaryFromAccount(
  accountId: string,
  organizationId: string
): Promise<void> {
  const supabase = await createClient()
  const resolvedId = resolveAccountId(accountId)

  const { count } = await supabase
    .from(Tables.contacts)
    .select("id", { count: "exact", head: true })
    .eq("account_id", resolvedId)

  if ((count ?? 0) > 0) return

  const { data: account } = await supabase
    .from(Tables.accounts)
    .select("contact, email, phone")
    .eq("id", resolvedId)
    .maybeSingle()

  if (!account) return
  const name = account.contact?.trim()
  if (!name && !account.email?.trim() && !account.phone?.trim()) return

  await supabase.from(Tables.contacts).insert({
    organization_id: organizationId,
    account_id: resolvedId,
    full_name: name || "Primary contact",
    email: account.email?.trim() || null,
    phone: account.phone?.trim() || null,
    is_primary: true,
  })
}

export async function listContactsByAccountId(
  accountId: string
): Promise<Contact[]> {
  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)
  const resolvedId = resolveAccountId(accountId)

  await ensurePrimaryFromAccount(resolvedId, organizationId)

  const { data, error } = await supabase
    .from(Tables.contacts)
    .select("*")
    .eq("account_id", resolvedId)
    .order("is_primary", { ascending: false })
    .order("full_name", { ascending: true })

  throwOnError({ data, error })
  return ((data ?? []) as ContactRow[]).map(mapContactRow)
}

export async function createContact(input: {
  accountId: string
  fullName: string
  roleTitle?: string | null
  email?: string | null
  phone?: string | null
  preferredChannel?: string | null
  personalNotes?: string | null
  nextTouchAt?: string | null
  isPrimary?: boolean
  relationshipOwnerId?: string | null
  nextTouchOwnerId?: string | null
}): Promise<Contact> {
  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)
  const accountId = resolveAccountId(input.accountId)

  if (input.isPrimary) {
    await supabase
      .from(Tables.contacts)
      .update({ is_primary: false })
      .eq("account_id", accountId)
  }

  const { data, error } = await supabase
    .from(Tables.contacts)
    .insert({
      organization_id: organizationId,
      account_id: accountId,
      full_name: input.fullName.trim(),
      role_title: input.roleTitle?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      preferred_channel: input.preferredChannel?.trim() || null,
      personal_notes: input.personalNotes?.trim() || null,
      next_touch_at: input.nextTouchAt || null,
      is_primary: input.isPrimary ?? false,
      relationship_owner_id: input.relationshipOwnerId ?? null,
      next_touch_owner_id: input.nextTouchOwnerId ?? null,
    })
    .select("*")
    .single()

  const row = throwOnError({ data, error }) as ContactRow
  return mapContactRow(row)
}

export async function updateContact(
  id: string,
  input: {
    fullName?: string
    roleTitle?: string | null
    email?: string | null
    phone?: string | null
    preferredChannel?: string | null
    personalNotes?: string | null
    nextTouchAt?: string | null
    isPrimary?: boolean
    relationshipOwnerId?: string | null
    nextTouchOwnerId?: string | null
  }
): Promise<Contact> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const { data: existing } = await supabase
    .from(Tables.contacts)
    .select("account_id")
    .eq("id", id)
    .maybeSingle()

  if (!existing) throw new Error("Contact not found")

  if (input.isPrimary) {
    await supabase
      .from(Tables.contacts)
      .update({ is_primary: false })
      .eq("account_id", existing.account_id)
  }

  const updates: {
    full_name?: string
    role_title?: string | null
    email?: string | null
    phone?: string | null
    preferred_channel?: string | null
    personal_notes?: string | null
    next_touch_at?: string | null
    is_primary?: boolean
    relationship_owner_id?: string | null
    next_touch_owner_id?: string | null
  } = {}
  if (input.fullName !== undefined) updates.full_name = input.fullName.trim()
  if (input.roleTitle !== undefined)
    updates.role_title = input.roleTitle?.trim() || null
  if (input.email !== undefined) updates.email = input.email?.trim() || null
  if (input.phone !== undefined) updates.phone = input.phone?.trim() || null
  if (input.preferredChannel !== undefined)
    updates.preferred_channel = input.preferredChannel?.trim() || null
  if (input.personalNotes !== undefined)
    updates.personal_notes = input.personalNotes?.trim() || null
  if (input.nextTouchAt !== undefined)
    updates.next_touch_at = input.nextTouchAt || null
  if (input.isPrimary !== undefined) updates.is_primary = input.isPrimary
  if (input.relationshipOwnerId !== undefined)
    updates.relationship_owner_id = input.relationshipOwnerId
  if (input.nextTouchOwnerId !== undefined)
    updates.next_touch_owner_id = input.nextTouchOwnerId

  const { data, error } = await supabase
    .from(Tables.contacts)
    .update(updates)
    .eq("id", id)
    .select("*")
    .single()

  const row = throwOnError({ data, error }) as ContactRow
  return mapContactRow(row)
}
