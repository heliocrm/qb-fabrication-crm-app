import { google } from "googleapis"
import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
} from "@/lib/supabase/schema"
import { updateContact } from "@/lib/supabase/services/contacts"
import { getGoogleOAuthConnection } from "@/lib/supabase/services/google-oauth-tokens"
import { createUserOAuthClientFromProfile } from "@/lib/google/auth/client"
import { CONTACTS_READONLY_SCOPE } from "@/lib/google/types"

export interface PeopleEnrichResult {
  googlePeopleScanned: number
  matchedByEmail: number
  contactsUpdated: number
  fieldsFilled: number
  skippedNoMatch: number
}

type GooglePersonBits = {
  phone: string | null
  roleTitle: string | null
}

type CrmContactRow = {
  id: string
  email: string | null
  phone: string | null
  role_title: string | null
}

function normalizeEmail(email: string | null | undefined): string | null {
  const e = email?.trim().toLowerCase()
  return e || null
}

export async function profileHasContactsReadonly(
  profileId: string
): Promise<boolean> {
  const connection = await getGoogleOAuthConnection(profileId)
  const scopes = connection?.scopes ?? []
  return scopes.some(
    (s) =>
      s === CONTACTS_READONLY_SCOPE || s.includes("contacts.readonly")
  )
}

/**
 * One-way enrich: match Google Contacts to existing CRM contacts by email.
 * Fills blank phone / role title only — never creates CRM contacts, never overwrites.
 */
export async function enrichCrmContactsFromGoogle(
  profileId: string
): Promise<PeopleEnrichResult> {
  if (!(await profileHasContactsReadonly(profileId))) {
    throw new Error(
      "Google Contacts access is not authorized. Disconnect and Connect Google again in Settings to grant contacts.readonly."
    )
  }

  const auth = await createUserOAuthClientFromProfile(profileId)
  const people = google.people({ version: "v1", auth })

  const byEmail = new Map<string, GooglePersonBits>()
  let pageToken: string | undefined
  let googlePeopleScanned = 0

  do {
    const res = await people.people.connections.list({
      resourceName: "people/me",
      personFields: "names,emailAddresses,phoneNumbers,organizations",
      pageSize: 200,
      pageToken,
    })

    for (const person of res.data.connections ?? []) {
      googlePeopleScanned += 1
      const phone =
        person.phoneNumbers?.find((p) => p.value?.trim())?.value?.trim() ||
        null
      const roleTitle =
        person.organizations?.find((o) => o.title?.trim())?.title?.trim() ||
        null

      for (const addr of person.emailAddresses ?? []) {
        const email = normalizeEmail(addr.value)
        if (!email) continue
        const existing = byEmail.get(email)
        byEmail.set(email, {
          phone: existing?.phone || phone,
          roleTitle: existing?.roleTitle || roleTitle,
        })
      }
    }

    pageToken = res.data.nextPageToken ?? undefined
  } while (pageToken)

  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.contacts)
    .select("id, email, phone, role_title")
    .eq("organization_id", organizationId)
    .not("email", "is", null)

  throwOnError({ data, error })
  const crmRows = (data ?? []) as CrmContactRow[]

  let matchedByEmail = 0
  let contactsUpdated = 0
  let fieldsFilled = 0
  let skippedNoMatch = 0

  for (const row of crmRows) {
    const email = normalizeEmail(row.email)
    if (!email) continue
    const googleBits = byEmail.get(email)
    if (!googleBits) {
      skippedNoMatch += 1
      continue
    }
    matchedByEmail += 1

    const patch: { phone?: string | null; roleTitle?: string | null } = {}
    if (!row.phone?.trim() && googleBits.phone) {
      patch.phone = googleBits.phone
      fieldsFilled += 1
    }
    if (!row.role_title?.trim() && googleBits.roleTitle) {
      patch.roleTitle = googleBits.roleTitle
      fieldsFilled += 1
    }

    if (Object.keys(patch).length === 0) continue
    await updateContact(row.id, patch)
    contactsUpdated += 1
  }

  return {
    googlePeopleScanned,
    matchedByEmail,
    contactsUpdated,
    fieldsFilled,
    skippedNoMatch,
  }
}
