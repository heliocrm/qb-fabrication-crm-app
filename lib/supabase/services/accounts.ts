import { createClient } from "@/lib/supabase/server"
import { Tables, requireOrganizationId, throwOnError } from "@/lib/supabase/schema"
import { mapAccountRow } from "@/lib/supabase/mappers"
import type { Account, AccountRow, AccountStatus } from "@/types"

export async function listAccounts(): Promise<Account[]> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.accounts)
    .select("*")
    .order("name", { ascending: true })

  throwOnError({ data, error })

  return ((data ?? []) as AccountRow[]).map(mapAccountRow)
}

export async function createAccount(input: {
  name: string
  shortName: string
  contact?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  state?: string | null
  status?: AccountStatus
}): Promise<Account> {
  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.accounts)
    .insert({
      organization_id: organizationId,
      name: input.name.trim(),
      short_name: input.shortName.trim(),
      contact: input.contact?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      status: input.status ?? "Active",
    })
    .select("*")
    .single()

  throwOnError({ data, error })
  return mapAccountRow(data as AccountRow)
}

export async function updateAccount(
  id: string,
  input: {
    name?: string
    shortName?: string
    contact?: string | null
    email?: string | null
    phone?: string | null
    city?: string | null
    state?: string | null
    status?: AccountStatus
  }
): Promise<Account> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const updates: {
    name?: string
    short_name?: string
    contact?: string | null
    email?: string | null
    phone?: string | null
    city?: string | null
    state?: string | null
    status?: AccountStatus
  } = {}
  if (input.name !== undefined) updates.name = input.name.trim()
  if (input.shortName !== undefined) updates.short_name = input.shortName.trim()
  if (input.contact !== undefined) updates.contact = input.contact?.trim() || null
  if (input.email !== undefined) updates.email = input.email?.trim() || null
  if (input.phone !== undefined) updates.phone = input.phone?.trim() || null
  if (input.city !== undefined) updates.city = input.city?.trim() || null
  if (input.state !== undefined) updates.state = input.state?.trim() || null
  if (input.status !== undefined) updates.status = input.status

  const { data, error } = await supabase
    .from(Tables.accounts)
    .update(updates)
    .eq("id", id)
    .select("*")
    .single()

  const row = throwOnError({ data, error }) as AccountRow
  return mapAccountRow(row)
}
