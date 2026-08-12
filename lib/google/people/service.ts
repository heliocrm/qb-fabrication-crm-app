import { google } from "googleapis"
import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
} from "@/lib/supabase/schema"
import {
  createContact,
  updateContact,
} from "@/lib/supabase/services/contacts"
import { createAccount } from "@/lib/supabase/services/accounts"
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

export type GoogleContactImportStatus =
  | "exists"
  | "new_on_account"
  | "new_account"
  | "needs_account"
  | "skip"

export interface GoogleContactImportRow {
  /** Stable row key: resourceName + primary email (or resourceName alone). */
  key: string
  resourceName: string
  fullName: string
  email: string | null
  phone: string | null
  roleTitle: string | null
  company: string | null
  status: GoogleContactImportStatus
  matchedAccountId: string | null
  matchedAccountName: string | null
  matchedContactId: string | null
  /** Suggested default selection for review UI. */
  recommended: boolean
}

export interface GoogleContactsImportPreview {
  rows: GoogleContactImportRow[]
  googlePeopleScanned: number
  importerProfileId: string
}

export interface GoogleContactImportSelection {
  key: string
  email: string | null
  fullName: string
  phone: string | null
  roleTitle: string | null
  company: string | null
  accountId?: string | null
  createAccountName?: string | null
  relationshipOwnerId: string
  enrichIfExists?: boolean
}

export interface GoogleContactsImportResult {
  accountsCreated: number
  contactsCreated: number
  contactsEnriched: number
  skipped: number
  errors: string[]
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

type NormalizedGooglePerson = {
  resourceName: string
  fullName: string
  email: string | null
  phone: string | null
  roleTitle: string | null
  company: string | null
}

function normalizeEmail(email: string | null | undefined): string | null {
  const e = email?.trim().toLowerCase()
  return e || null
}

function normalizeNameKey(name: string | null | undefined): string | null {
  const n = name?.trim().toLowerCase()
  return n || null
}

/** Uppercase alphanumeric short code (~3–8 chars) with collision suffix. */
export function deriveShortName(
  name: string,
  existing: Set<string>
): string {
  const base = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8)
  const seed = base.length >= 3 ? base : (base || "ACCT").padEnd(3, "X")
  let candidate = seed.slice(0, 8)
  let n = 2
  while (existing.has(candidate.toLowerCase())) {
    const suffix = String(n)
    candidate = `${seed.slice(0, Math.max(1, 8 - suffix.length))}${suffix}`
    n += 1
    if (n > 9999) {
      candidate = `A${Date.now().toString(36).toUpperCase()}`.slice(0, 8)
      break
    }
  }
  existing.add(candidate.toLowerCase())
  return candidate
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

async function requireContactsAccess(profileId: string): Promise<void> {
  if (!(await profileHasContactsReadonly(profileId))) {
    throw new Error(
      "Google Contacts access is not authorized. Disconnect and Connect Google again in Settings to grant contacts.readonly."
    )
  }
}

async function fetchNormalizedGooglePeople(
  profileId: string
): Promise<{ people: NormalizedGooglePerson[]; scanned: number }> {
  const auth = await createUserOAuthClientFromProfile(profileId)
  const peopleApi = google.people({ version: "v1", auth })

  const people: NormalizedGooglePerson[] = []
  let pageToken: string | undefined
  let scanned = 0

  do {
    const res = await peopleApi.people.connections.list({
      resourceName: "people/me",
      personFields: "names,emailAddresses,phoneNumbers,organizations",
      pageSize: 200,
      pageToken,
    })

    for (const person of res.data.connections ?? []) {
      scanned += 1
      const resourceName = person.resourceName?.trim() || `unknown-${scanned}`
      const fullName =
        person.names?.find((n) => n.displayName?.trim())?.displayName?.trim() ||
        person.names?.find((n) => n.givenName?.trim())?.givenName?.trim() ||
        "Unknown"
      const phone =
        person.phoneNumbers?.find((p) => p.value?.trim())?.value?.trim() || null
      const org =
        person.organizations?.find((o) => o.name?.trim() || o.title?.trim()) ??
        null
      const company = org?.name?.trim() || null
      const roleTitle = org?.title?.trim() || null
      const emails = (person.emailAddresses ?? [])
        .map((a) => normalizeEmail(a.value))
        .filter((e): e is string => Boolean(e))

      if (emails.length === 0) {
        people.push({
          resourceName,
          fullName,
          email: null,
          phone,
          roleTitle,
          company,
        })
        continue
      }

      // One row per unique email (same person may list multiple).
      const seen = new Set<string>()
      for (const email of emails) {
        if (seen.has(email)) continue
        seen.add(email)
        people.push({
          resourceName,
          fullName,
          email,
          phone,
          roleTitle,
          company,
        })
      }
    }

    pageToken = res.data.nextPageToken ?? undefined
  } while (pageToken)

  return { people, scanned }
}

function rowKey(resourceName: string, email: string | null): string {
  return email ? `${resourceName}::${email}` : `${resourceName}::no-email`
}

/**
 * One-way enrich: match Google Contacts to existing CRM contacts by email.
 * Fills blank phone / role title only — never creates CRM contacts, never overwrites.
 */
export async function enrichCrmContactsFromGoogle(
  profileId: string
): Promise<PeopleEnrichResult> {
  await requireContactsAccess(profileId)

  const { people, scanned: googlePeopleScanned } =
    await fetchNormalizedGooglePeople(profileId)

  const byEmail = new Map<string, GooglePersonBits>()
  for (const person of people) {
    if (!person.email) continue
    const existing = byEmail.get(person.email)
    byEmail.set(person.email, {
      phone: existing?.phone || person.phone,
      roleTitle: existing?.roleTitle || person.roleTitle,
    })
  }

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

/**
 * Preview Google Contacts for CRM import — classify only, no writes.
 */
export async function listGoogleContactsForImport(
  profileId: string
): Promise<GoogleContactsImportPreview> {
  await requireContactsAccess(profileId)

  const { people, scanned } = await fetchNormalizedGooglePeople(profileId)

  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)

  const [contactsRes, accountsRes] = await Promise.all([
    supabase
      .from(Tables.contacts)
      .select("id, email")
      .eq("organization_id", organizationId)
      .not("email", "is", null),
    supabase
      .from(Tables.accounts)
      .select("id, name")
      .eq("organization_id", organizationId),
  ])

  throwOnError(contactsRes)
  throwOnError(accountsRes)

  const emailToContactId = new Map<string, string>()
  for (const row of contactsRes.data ?? []) {
    const email = normalizeEmail(
      (row as { id: string; email: string | null }).email
    )
    if (!email) continue
    if (!emailToContactId.has(email)) {
      emailToContactId.set(email, (row as { id: string }).id)
    }
  }

  const accountByName = new Map<string, { id: string; name: string }>()
  for (const row of accountsRes.data ?? []) {
    const r = row as { id: string; name: string }
    const key = normalizeNameKey(r.name)
    if (!key) continue
    if (!accountByName.has(key)) {
      accountByName.set(key, { id: r.id, name: r.name })
    }
  }

  const rows: GoogleContactImportRow[] = people.map((person) => {
    const key = rowKey(person.resourceName, person.email)

    if (!person.email) {
      return {
        key,
        resourceName: person.resourceName,
        fullName: person.fullName,
        email: null,
        phone: person.phone,
        roleTitle: person.roleTitle,
        company: person.company,
        status: "skip" as const,
        matchedAccountId: null,
        matchedAccountName: null,
        matchedContactId: null,
        recommended: false,
      }
    }

    const existingContactId = emailToContactId.get(person.email)
    if (existingContactId) {
      return {
        key,
        resourceName: person.resourceName,
        fullName: person.fullName,
        email: person.email,
        phone: person.phone,
        roleTitle: person.roleTitle,
        company: person.company,
        status: "exists" as const,
        matchedAccountId: null,
        matchedAccountName: null,
        matchedContactId: existingContactId,
        recommended: false,
      }
    }

    const companyKey = normalizeNameKey(person.company)
    if (companyKey) {
      const match = accountByName.get(companyKey)
      if (match) {
        return {
          key,
          resourceName: person.resourceName,
          fullName: person.fullName,
          email: person.email,
          phone: person.phone,
          roleTitle: person.roleTitle,
          company: person.company,
          status: "new_on_account" as const,
          matchedAccountId: match.id,
          matchedAccountName: match.name,
          matchedContactId: null,
          recommended: true,
        }
      }
      return {
        key,
        resourceName: person.resourceName,
        fullName: person.fullName,
        email: person.email,
        phone: person.phone,
        roleTitle: person.roleTitle,
        company: person.company,
        status: "new_account" as const,
        matchedAccountId: null,
        matchedAccountName: null,
        matchedContactId: null,
        recommended: true,
      }
    }

    return {
      key,
      resourceName: person.resourceName,
      fullName: person.fullName,
      email: person.email,
      phone: person.phone,
      roleTitle: person.roleTitle,
      company: person.company,
      status: "needs_account" as const,
      matchedAccountId: null,
      matchedAccountName: null,
      matchedContactId: null,
      recommended: false,
    }
  })

  return {
    rows,
    googlePeopleScanned: scanned,
    importerProfileId: profileId,
  }
}

async function accountHasContacts(accountId: string): Promise<boolean> {
  const supabase = await createClient()
  const { count } = await supabase
    .from(Tables.contacts)
    .select("id", { count: "exact", head: true })
    .eq("account_id", accountId)
  return (count ?? 0) > 0
}

async function validateOwnerProfileId(
  organizationId: string,
  ownerId: string
): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from(Tables.profiles)
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", ownerId)
    .eq("is_active", true)
    .maybeSingle()
  return Boolean(data)
}

/**
 * Commit selected Google Contacts into CRM accounts/contacts.
 * Re-validates email uniqueness and account resolution; does not trust client status.
 */
export async function importGoogleContacts(
  profileId: string,
  selections: GoogleContactImportSelection[]
): Promise<GoogleContactsImportResult> {
  await requireContactsAccess(profileId)

  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)

  const result: GoogleContactsImportResult = {
    accountsCreated: 0,
    contactsCreated: 0,
    contactsEnriched: 0,
    skipped: 0,
    errors: [],
  }

  if (selections.length === 0) return result

  const { data: contactRows } = await supabase
    .from(Tables.contacts)
    .select("id, email, phone, role_title")
    .eq("organization_id", organizationId)
    .not("email", "is", null)

  const emailToContact = new Map<string, CrmContactRow>()
  for (const row of (contactRows ?? []) as CrmContactRow[]) {
    const email = normalizeEmail(row.email)
    if (!email) continue
    if (!emailToContact.has(email)) emailToContact.set(email, row)
  }

  const { data: accountRows } = await supabase
    .from(Tables.accounts)
    .select("id, name, short_name")
    .eq("organization_id", organizationId)

  const accountById = new Map<string, { id: string; name: string }>()
  const accountByName = new Map<string, { id: string; name: string }>()
  const shortNames = new Set<string>()
  for (const row of accountRows ?? []) {
    const r = row as { id: string; name: string; short_name: string }
    accountById.set(r.id, { id: r.id, name: r.name })
    const nk = normalizeNameKey(r.name)
    if (nk && !accountByName.has(nk)) {
      accountByName.set(nk, { id: r.id, name: r.name })
    }
    if (r.short_name) shortNames.add(r.short_name.toLowerCase())
  }

  // Cache accounts created in this batch by normalized name.
  const createdAccountsByName = new Map<string, string>()

  for (const sel of selections) {
    const email = normalizeEmail(sel.email)
    const fullName = sel.fullName?.trim() || "Unknown"
    const phone = sel.phone?.trim() || null
    const roleTitle = sel.roleTitle?.trim() || null

    if (!email) {
      result.skipped += 1
      continue
    }

    if (!(await validateOwnerProfileId(organizationId, sel.relationshipOwnerId))) {
      result.errors.push(`${email}: invalid relationship owner`)
      result.skipped += 1
      continue
    }

    const existing = emailToContact.get(email)
    if (existing) {
      if (sel.enrichIfExists) {
        const patch: { phone?: string | null; roleTitle?: string | null } = {}
        if (!existing.phone?.trim() && phone) patch.phone = phone
        if (!existing.role_title?.trim() && roleTitle) patch.roleTitle = roleTitle
        if (Object.keys(patch).length > 0) {
          await updateContact(existing.id, patch)
          result.contactsEnriched += 1
          emailToContact.set(email, {
            ...existing,
            phone: patch.phone ?? existing.phone,
            role_title: patch.roleTitle ?? existing.role_title,
          })
        } else {
          result.skipped += 1
        }
      } else {
        result.skipped += 1
      }
      continue
    }

    let accountId: string | null = null

    if (sel.accountId?.trim()) {
      const id = sel.accountId.trim()
      if (!accountById.has(id)) {
        result.errors.push(`${email}: account not found`)
        result.skipped += 1
        continue
      }
      accountId = id
    } else if (sel.createAccountName?.trim()) {
      const name = sel.createAccountName.trim()
      const nk = normalizeNameKey(name)!
      const cached = createdAccountsByName.get(nk) ?? accountByName.get(nk)?.id
      if (cached) {
        accountId = cached
      } else {
        const shortName = deriveShortName(name, shortNames)
        const account = await createAccount({
          name,
          shortName,
          contact: fullName,
          email,
          phone,
        })
        accountId = account.id
        accountById.set(account.id, { id: account.id, name: account.name })
        accountByName.set(nk, { id: account.id, name: account.name })
        createdAccountsByName.set(nk, account.id)
        result.accountsCreated += 1
      }
    } else {
      // Fall back to company name match / create if company present
      const company = sel.company?.trim() || null
      if (company) {
        const nk = normalizeNameKey(company)!
        const match =
          createdAccountsByName.get(nk) ?? accountByName.get(nk)?.id ?? null
        if (match) {
          accountId = match
        } else {
          const shortName = deriveShortName(company, shortNames)
          const account = await createAccount({
            name: company,
            shortName,
            contact: fullName,
            email,
            phone,
          })
          accountId = account.id
          accountById.set(account.id, { id: account.id, name: account.name })
          accountByName.set(nk, { id: account.id, name: account.name })
          createdAccountsByName.set(nk, account.id)
          result.accountsCreated += 1
        }
      } else {
        result.errors.push(`${email}: account required (no company)`)
        result.skipped += 1
        continue
      }
    }

    if (!accountId) {
      result.skipped += 1
      continue
    }

    const hasContacts = await accountHasContacts(accountId)
    const contact = await createContact({
      accountId,
      fullName,
      email,
      phone,
      roleTitle,
      isPrimary: !hasContacts,
      relationshipOwnerId: sel.relationshipOwnerId,
      nextTouchOwnerId: sel.relationshipOwnerId,
    })

    emailToContact.set(email, {
      id: contact.id,
      email,
      phone: contact.phone || null,
      role_title: contact.roleTitle || null,
    })
    result.contactsCreated += 1
  }

  return result
}
