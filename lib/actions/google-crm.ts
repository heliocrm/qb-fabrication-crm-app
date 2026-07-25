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
import { syncGmailForProfile } from "@/lib/google/gmail/service"
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
    return {
      configured,
      connected: Boolean(connection),
      email: connection?.email ?? null,
      scopes: connection?.scopes ?? [],
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
