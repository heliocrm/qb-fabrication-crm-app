import { google } from "googleapis"
import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
} from "@/lib/supabase/schema"
import { upsertExternalCrmActivity } from "@/lib/supabase/services/crm-activities"
import { touchCalendarSyncAt } from "@/lib/supabase/services/google-oauth-tokens"
import { createUserOAuthClientFromProfile } from "@/lib/google/auth/client"

const WINDOW_DAYS = 14

export interface CreateCrmMeetingInput {
  profileId: string
  title: string
  startIso: string
  endIso: string
  attendeeEmails: string[]
  notes?: string
  createMeetLink?: boolean
  accountId?: string | null
  contactId?: string | null
  jobId?: string | null
}

export interface CreateCrmMeetingResult {
  eventId: string
  htmlLink: string | null
  hangoutLink: string | null
  activityId: string
}

export interface CalendarSyncResult {
  eventsScanned: number
  activitiesUpserted: number
  skippedNoMatch: number
}

type ContactMatch = {
  id: string
  accountId: string
  email: string
}

async function loadContactEmailMap(
  organizationId: string
): Promise<Map<string, ContactMatch>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from(Tables.contacts)
    .select("id, account_id, email")
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
    })
  }
  return map
}

/** Create a Calendar event and log crm_activities kind=meeting */
export async function createCrmMeeting(
  input: CreateCrmMeetingInput
): Promise<CreateCrmMeetingResult> {
  const auth = await createUserOAuthClientFromProfile(input.profileId)
  const calendar = google.calendar({ version: "v3", auth })

  const attendees = input.attendeeEmails
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .map((email) => ({ email }))

  const event = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: input.createMeetLink ? 1 : 0,
    requestBody: {
      summary: input.title,
      description: input.notes?.trim() || undefined,
      start: { dateTime: input.startIso },
      end: { dateTime: input.endIso },
      attendees: attendees.length > 0 ? attendees : undefined,
      conferenceData: input.createMeetLink
        ? {
            createRequest: {
              requestId: `crm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          }
        : undefined,
    },
  })

  const eventId = event.data.id
  if (!eventId) throw new Error("Calendar did not return an event id")

  const hangoutLink =
    event.data.hangoutLink ??
    event.data.conferenceData?.entryPoints?.find(
      (e) => e.entryPointType === "video"
    )?.uri ??
    null

  const bodyParts = [
    input.title,
    input.notes?.trim(),
    hangoutLink ? `Meet: ${hangoutLink}` : null,
    event.data.htmlLink ? `Calendar: ${event.data.htmlLink}` : null,
  ].filter(Boolean)

  const activity = await upsertExternalCrmActivity({
    accountId: input.accountId ?? null,
    contactId: input.contactId ?? null,
    jobId: input.jobId ?? null,
    kind: "meeting",
    body: bodyParts.join("\n"),
    occurredAt: input.startIso,
    createdBy: input.profileId,
    externalSource: "calendar",
    externalId: eventId,
    metadata: {
      eventId,
      htmlLink: event.data.htmlLink ?? null,
      hangoutLink,
      title: input.title,
    },
  })

  if (input.contactId) {
    const supabase = await createClient()
    await supabase
      .from(Tables.contacts)
      .update({ last_contact_at: input.startIso })
      .eq("id", input.contactId)
  }

  return {
    eventId,
    htmlLink: event.data.htmlLink ?? null,
    hangoutLink,
    activityId: activity.id,
  }
}

/** Light inbound sync: events ±14 days with known contact attendees */
export async function syncCalendarForProfile(
  profileId: string
): Promise<CalendarSyncResult> {
  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)
  const auth = await createUserOAuthClientFromProfile(profileId)
  const calendar = google.calendar({ version: "v3", auth })

  const timeMin = new Date()
  timeMin.setDate(timeMin.getDate() - WINDOW_DAYS)
  const timeMax = new Date()
  timeMax.setDate(timeMax.getDate() + WINDOW_DAYS)

  const list = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 100,
  })

  const events = list.data.items ?? []
  const contacts = await loadContactEmailMap(organizationId)
  let activitiesUpserted = 0
  let skippedNoMatch = 0

  for (const ev of events) {
    if (!ev.id || ev.status === "cancelled") continue
    const attendeeEmails = (ev.attendees ?? [])
      .map((a) => a.email?.toLowerCase())
      .filter((e): e is string => Boolean(e))

    const matched = attendeeEmails
      .map((e) => contacts.get(e))
      .filter((c): c is ContactMatch => Boolean(c))

    if (matched.length === 0) {
      skippedNoMatch += 1
      continue
    }

    const startIso =
      ev.start?.dateTime ??
      (ev.start?.date ? `${ev.start.date}T12:00:00.000Z` : new Date().toISOString())
    const hangoutLink =
      ev.hangoutLink ??
      ev.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")
        ?.uri ??
      null
    const title = ev.summary ?? "(untitled meeting)"
    const bodyParts = [
      title,
      ev.description?.slice(0, 500),
      hangoutLink ? `Meet: ${hangoutLink}` : null,
      ev.htmlLink ? `Calendar: ${ev.htmlLink}` : null,
    ].filter(Boolean)

    for (const contact of matched) {
      await upsertExternalCrmActivity({
        accountId: contact.accountId,
        contactId: contact.id,
        jobId: null,
        kind: "meeting",
        body: bodyParts.join("\n"),
        occurredAt: startIso,
        createdBy: profileId,
        externalSource: "calendar",
        externalId: `${ev.id}:${contact.id}`,
        metadata: {
          eventId: ev.id,
          htmlLink: ev.htmlLink ?? null,
          hangoutLink,
          title,
          matchedEmail: contact.email,
        },
      })
      activitiesUpserted += 1
    }
  }

  await touchCalendarSyncAt(profileId)
  return {
    eventsScanned: events.length,
    activitiesUpserted,
    skippedNoMatch,
  }
}

/** @deprecated stub — use createCrmMeeting / syncCalendarForProfile */
export class GoogleCalendarService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_auth: unknown) {}

  async createDeliveryEvent(_input: {
    jobNumber: string
    deliveryDate: string
    customerName: string
  }): Promise<{ eventId: string }> {
    throw new Error(
      "Use createCrmMeeting() for CRM calendar events."
    )
  }
}
