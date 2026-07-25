import { google, type gmail_v1 } from "googleapis"
import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
} from "@/lib/supabase/schema"
import { upsertExternalCrmActivity } from "@/lib/supabase/services/crm-activities"
import {
  getGoogleOAuthConnection,
  touchGmailSyncAt,
} from "@/lib/supabase/services/google-oauth-tokens"
import { createUserOAuthClientFromProfile } from "@/lib/google/auth/client"
import { GMAIL_SEND_SCOPE } from "@/lib/google/types"

const THREAD_CAP = 50
const LOOKBACK_DAYS = 30
const JOB_NUMBER_RE = /\bQB-\d{4}-\d+\b/i

export interface GmailSyncResult {
  threadsScanned: number
  activitiesUpserted: number
  skippedNoMatch: number
}

type ContactMatch = {
  id: string
  accountId: string
  email: string
  lastContactAt: string | null
}

function extractEmails(headerValue: string | null | undefined): string[] {
  if (!headerValue) return []
  const matches = headerValue.matchAll(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  )
  return [...matches].map((m) => m[0].toLowerCase())
}

function header(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string
): string | null {
  const h = headers?.find(
    (x) => x.name?.toLowerCase() === name.toLowerCase()
  )
  return h?.value ?? null
}

function decodeBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return ""
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf8")
  }
  for (const part of payload.parts ?? []) {
    const text = decodeBody(part)
    if (text) return text
  }
  return ""
}

async function loadContactEmailMap(
  organizationId: string
): Promise<Map<string, ContactMatch>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from(Tables.contacts)
    .select("id, account_id, email, last_contact_at")
    .eq("organization_id", organizationId)
    .not("email", "is", null)

  throwOnError({ data, error })
  const map = new Map<string, ContactMatch>()
  for (const row of data ?? []) {
    const email = (row.email as string | null)?.trim().toLowerCase()
    if (!email) continue
    map.set(email, {
      id: row.id as string,
      accountId: row.account_id as string,
      email,
      lastContactAt: (row.last_contact_at as string | null) ?? null,
    })
  }
  return map
}

async function resolveJobIdByNumber(
  organizationId: string,
  jobNumber: string
): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from(Tables.jobs)
    .select("id")
    .eq("organization_id", organizationId)
    .ilike("job_number", jobNumber)
    .maybeSingle()
  return (data?.id as string | undefined) ?? null
}

async function bumpLastContactAt(
  contactId: string,
  occurredAt: string,
  previous: string | null
): Promise<void> {
  if (previous && new Date(previous).getTime() >= new Date(occurredAt).getTime()) {
    return
  }
  const supabase = await createClient()
  await supabase
    .from(Tables.contacts)
    .update({ last_contact_at: occurredAt })
    .eq("id", contactId)
}

/**
 * Sync recent Gmail threads that involve known CRM contacts into crm_activities.
 * Manual Sync now only — no cron.
 */
export async function syncGmailForProfile(
  profileId: string
): Promise<GmailSyncResult> {
  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)
  const auth = await createUserOAuthClientFromProfile(profileId)
  const gmail = google.gmail({ version: "v1", auth })

  const after = new Date()
  after.setDate(after.getDate() - LOOKBACK_DAYS)
  const afterQ = `after:${after.getFullYear()}/${after.getMonth() + 1}/${after.getDate()}`

  const list = await gmail.users.threads.list({
    userId: "me",
    q: afterQ,
    maxResults: THREAD_CAP,
  })

  const threads = list.data.threads ?? []
  const contacts = await loadContactEmailMap(organizationId)
  let activitiesUpserted = 0
  let skippedNoMatch = 0

  for (const t of threads) {
    if (!t.id) continue
    const full = await gmail.users.threads.get({
      userId: "me",
      id: t.id,
      format: "full",
    })

    const messages = full.data.messages ?? []
    if (messages.length === 0) continue

    const participantEmails = new Set<string>()
    let subject = "(no subject)"
    let snippet = full.data.snippet ?? ""
    let latestMs = 0
    let bodySample = ""

    for (const msg of messages) {
      const headers = msg.payload?.headers
      for (const name of ["From", "To", "Cc"]) {
        for (const email of extractEmails(header(headers, name))) {
          participantEmails.add(email)
        }
      }
      const sub = header(headers, "Subject")
      if (sub) subject = sub
      const internal = Number(msg.internalDate ?? 0)
      if (internal > latestMs) {
        latestMs = internal
        snippet = msg.snippet ?? snippet
        bodySample = decodeBody(msg.payload).slice(0, 4000)
      }
    }

    const matched = [...participantEmails]
      .map((e) => contacts.get(e))
      .filter((c): c is ContactMatch => Boolean(c))

    if (matched.length === 0) {
      skippedNoMatch += 1
      continue
    }

    // Prefer primary-looking match: first contact; if multiple accounts, one activity per contact
    const haystack = `${subject}\n${snippet}\n${bodySample}`
    const jobMatch = haystack.match(JOB_NUMBER_RE)
    const jobId = jobMatch
      ? await resolveJobIdByNumber(organizationId, jobMatch[0])
      : null

    const occurredAt = new Date(latestMs || Date.now()).toISOString()
    const deepLink = `https://mail.google.com/mail/u/0/#inbox/${t.id}`

    for (const contact of matched) {
      await upsertExternalCrmActivity({
        accountId: contact.accountId,
        contactId: contact.id,
        jobId,
        kind: "email",
        body: subject,
        occurredAt,
        createdBy: profileId,
        externalSource: "gmail",
        externalId: `${t.id}:${contact.id}`,
        metadata: {
          subject,
          snippet,
          threadId: t.id,
          deepLink,
          matchedEmail: contact.email,
        },
      })
      await bumpLastContactAt(contact.id, occurredAt, contact.lastContactAt)
      contact.lastContactAt = occurredAt
      activitiesUpserted += 1
    }
  }

  await touchGmailSyncAt(profileId)
  return {
    threadsScanned: threads.length,
    activitiesUpserted,
    skippedNoMatch,
  }
}

function encodeRawMessage(mime: string): string {
  return Buffer.from(mime)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function buildMimeMessage(input: {
  from: string
  to: string
  subject: string
  bodyText: string
  replyToMessageId?: string | null
  references?: string | null
}): string {
  const lines = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
  ]
  if (input.replyToMessageId) {
    lines.push(`In-Reply-To: ${input.replyToMessageId}`)
    lines.push(
      `References: ${input.references?.trim() || input.replyToMessageId}`
    )
  }
  lines.push("", input.bodyText)
  return lines.join("\r\n")
}

export async function profileHasGmailSend(profileId: string): Promise<boolean> {
  const connection = await getGoogleOAuthConnection(profileId)
  if (!connection) return false
  return connection.scopes.some(
    (s) => s === GMAIL_SEND_SCOPE || s.includes("gmail.send")
  )
}

export interface SendCrmEmailInput {
  profileId: string
  to: string
  subject: string
  bodyText: string
  accountId?: string | null
  contactId?: string | null
  jobId?: string | null
  /** Gmail thread id for reply */
  threadId?: string | null
  /** RFC Message-ID of parent for In-Reply-To */
  replyToMessageId?: string | null
}

export interface SendCrmEmailResult {
  messageId: string
  threadId: string | null
  activityId: string
}

/** Send email via connected Gmail and log crm_activities kind=email */
export async function sendCrmEmail(
  input: SendCrmEmailInput
): Promise<SendCrmEmailResult> {
  const to = input.to.trim().toLowerCase()
  if (!to || !to.includes("@")) {
    throw new Error("A valid recipient email is required")
  }
  if (!input.subject.trim()) {
    throw new Error("Subject is required")
  }
  if (!input.bodyText.trim()) {
    throw new Error("Message body is required")
  }

  const canSend = await profileHasGmailSend(input.profileId)
  if (!canSend) {
    throw new Error(
      "Gmail send is not authorized. Disconnect and Connect Google again in Settings to grant send access."
    )
  }

  const connection = await getGoogleOAuthConnection(input.profileId)
  if (!connection) {
    throw new Error("Google Workspace is not connected. Connect in Settings.")
  }

  const auth = await createUserOAuthClientFromProfile(input.profileId)
  const gmail = google.gmail({ version: "v1", auth })

  const mime = buildMimeMessage({
    from: connection.email,
    to,
    subject: input.subject.trim(),
    bodyText: input.bodyText.trim(),
    replyToMessageId: input.replyToMessageId,
  })

  const sent = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodeRawMessage(mime),
      threadId: input.threadId || undefined,
    },
  })

  const messageId = sent.data.id
  if (!messageId) throw new Error("Gmail did not return a message id")
  const threadId = sent.data.threadId ?? input.threadId ?? null
  const deepLink = threadId
    ? `https://mail.google.com/mail/u/0/#inbox/${threadId}`
    : null
  const occurredAt = new Date().toISOString()
  const body = `${input.subject.trim()}\n\n${input.bodyText.trim()}`

  const activity = await upsertExternalCrmActivity({
    accountId: input.accountId ?? null,
    contactId: input.contactId ?? null,
    jobId: input.jobId ?? null,
    kind: "email",
    body,
    occurredAt,
    createdBy: input.profileId,
    externalSource: "gmail",
    externalId: `outbound:${messageId}`,
    metadata: {
      subject: input.subject.trim(),
      snippet: input.bodyText.trim().slice(0, 200),
      threadId,
      messageId,
      deepLink,
      direction: "outbound",
      to,
      from: connection.email,
    },
  })

  return {
    messageId,
    threadId,
    activityId: activity.id,
  }
}

/** @deprecated use syncGmailForProfile / sendCrmEmail */
export class GoogleGmailService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_auth: unknown) {}

  async sendJobNotification(_input: {
    to: string
    subject: string
    bodyHtml: string
  }): Promise<{ messageId: string }> {
    throw new Error("Use sendCrmEmail() for outbound CRM mail.")
  }
}
