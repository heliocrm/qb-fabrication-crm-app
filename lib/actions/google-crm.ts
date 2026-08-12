"use server"

import { revalidatePath } from "next/cache"
import { requireSessionContext } from "@/lib/auth/session"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { SupabaseServiceError } from "@/lib/supabase/schema"
import {
  deleteGoogleOAuthToken,
  getGoogleOAuthConnection,
} from "@/lib/supabase/services/google-oauth-tokens"
import {
  isGoogleOAuthConfigured,
} from "@/lib/google/oauth-config"
import { isTokenEncryptionConfigured } from "@/lib/google/crypto/token-seal"
import {
  profileHasGmailSend,
  sendCrmEmail,
  syncGmailForProfile,
} from "@/lib/google/gmail/service"
import {
  enrichCrmContactsFromGoogle,
  importGoogleContacts,
  listGoogleContactsForImport,
  profileHasContactsReadonly,
  type GoogleContactImportSelection,
} from "@/lib/google/people/service"
import { listAccounts } from "@/lib/supabase/services/accounts"
import { listOrgUsersForPicker } from "@/lib/supabase/services/profiles"
import {
  CONTACTS_READONLY_SCOPE,
  GMAIL_SEND_SCOPE,
} from "@/lib/google/types"
import {
  createCrmMeeting,
  syncCalendarForProfile,
} from "@/lib/google/calendar/service"

async function safeAction<T>(
  fn: () => Promise<T>
): Promise<{ data?: T; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured" }
  }
  try {
    return { data: await fn() }
  } catch (err) {
    const message =
      err instanceof SupabaseServiceError
        ? err.message
        : err instanceof Error
          ? err.message
          : "An unexpected error occurred"
    return { error: message }
  }
}

export async function getGoogleConnectionStatusAction() {
  return safeAction(async () => {
    const ctx = await requireSessionContext()
    const configured =
      isGoogleOAuthConfigured() && isTokenEncryptionConfigured()
    const connection = await getGoogleOAuthConnection(ctx.profileId)
    const scopes = connection?.scopes ?? []
    const canSendGmail =
      Boolean(connection) &&
      (await profileHasGmailSend(ctx.profileId))
    const canReadContacts =
      Boolean(connection) &&
      (await profileHasContactsReadonly(ctx.profileId))
    return {
      configured,
      connected: Boolean(connection),
      email: connection?.email ?? null,
      scopes,
      canSendGmail,
      canReadContacts,
      needsSendReconnect:
        Boolean(connection) &&
        !scopes.some(
          (s) => s === GMAIL_SEND_SCOPE || s.includes("gmail.send")
        ),
      needsContactsReconnect:
        Boolean(connection) &&
        !scopes.some(
          (s) =>
            s === CONTACTS_READONLY_SCOPE || s.includes("contacts.readonly")
        ),
      lastGmailSyncAt: connection?.lastGmailSyncAt ?? null,
      lastCalendarSyncAt: connection?.lastCalendarSyncAt ?? null,
      connectedAt: connection?.connectedAt ?? null,
    }
  })
}

export async function disconnectGoogleAction() {
  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    await deleteGoogleOAuthToken(ctx.profileId)
    return { ok: true as const }
  })
  if (result.data) revalidatePath("/settings")
  return result
}

export async function syncGmailNowAction() {
  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    return syncGmailForProfile(ctx.profileId)
  })
  if (result.data) {
    revalidatePath("/settings")
    revalidatePath("/customers")
    revalidatePath("/customers/needs-a-touch")
  }
  return result
}

export async function syncCalendarNowAction() {
  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    return syncCalendarForProfile(ctx.profileId)
  })
  if (result.data) {
    revalidatePath("/settings")
    revalidatePath("/customers")
    revalidatePath("/customers/needs-a-touch")
  }
  return result
}

/** One-way: fill blank CRM contact phone/title from Google Contacts (match by email). */
export async function enrichContactsFromGoogleAction() {
  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    return enrichCrmContactsFromGoogle(ctx.profileId)
  })
  if (result.data) {
    revalidatePath("/settings")
    revalidatePath("/customers")
  }
  return result
}

/** Preview Google Contacts for CRM import (classify only). */
export async function previewGoogleContactsImportAction() {
  return safeAction(async () => {
    const ctx = await requireSessionContext()
    const [preview, accounts, owners] = await Promise.all([
      listGoogleContactsForImport(ctx.profileId),
      listAccounts(),
      listOrgUsersForPicker(),
    ])
    return {
      ...preview,
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        shortName: a.shortName,
      })),
      owners,
      currentProfileId: ctx.profileId,
    }
  })
}

/** Commit selected Google Contacts into CRM. */
export async function commitGoogleContactsImportAction(
  selections: GoogleContactImportSelection[]
) {
  if (!Array.isArray(selections) || selections.length === 0) {
    return { error: "Select at least one contact to import" }
  }

  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    return importGoogleContacts(ctx.profileId, selections)
  })

  if (result.data) {
    revalidatePath("/settings")
    revalidatePath("/customers")
    revalidatePath("/customers/needs-a-touch")
  }
  return result
}

export async function scheduleCrmMeetingAction(input: {
  title: string
  startIso: string
  endIso: string
  attendeeEmails: string[]
  notes?: string
  createMeetLink?: boolean
  accountId?: string | null
  contactId?: string | null
  jobId?: string | null
}) {
  if (!input.title?.trim()) {
    return { error: "Meeting title is required" }
  }
  if (!input.startIso || !input.endIso) {
    return { error: "Start and end times are required" }
  }

  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    return createCrmMeeting({
      profileId: ctx.profileId,
      title: input.title.trim(),
      startIso: input.startIso,
      endIso: input.endIso,
      attendeeEmails: input.attendeeEmails,
      notes: input.notes,
      createMeetLink: input.createMeetLink ?? true,
      accountId: input.accountId,
      contactId: input.contactId,
      jobId: input.jobId,
    })
  })

  if (result.data) {
    revalidatePath("/customers")
    if (input.jobId) revalidatePath(`/jobs/${input.jobId}`)
  }
  return result
}

export async function sendCrmEmailAction(input: {
  to: string
  subject: string
  bodyText: string
  accountId?: string | null
  contactId?: string | null
  jobId?: string | null
  threadId?: string | null
  replyToMessageId?: string | null
}) {
  if (!input.to?.trim()) return { error: "Recipient is required" }
  if (!input.subject?.trim()) return { error: "Subject is required" }
  if (!input.bodyText?.trim()) return { error: "Message body is required" }

  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    return sendCrmEmail({
      profileId: ctx.profileId,
      to: input.to,
      subject: input.subject,
      bodyText: input.bodyText,
      accountId: input.accountId,
      contactId: input.contactId,
      jobId: input.jobId,
      threadId: input.threadId,
      replyToMessageId: input.replyToMessageId,
    })
  })

  if (result.data) {
    revalidatePath("/customers")
    if (input.jobId) revalidatePath(`/jobs/${input.jobId}`)
  }
  return result
}
