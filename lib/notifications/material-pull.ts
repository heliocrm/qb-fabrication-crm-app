/**
 * Material pull notification orchestration.
 * Prefer Web Push; fall back to Resend email when no subscription.
 */

import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { Tables } from "@/lib/supabase/schema"
import {
  deletePushSubscriptionById,
  listPushSubscriptionsForProfiles,
} from "@/lib/supabase/services/push-subscriptions"
import { sendWebPush } from "@/lib/push/web-push"
import { sendMaterialPullEmail } from "@/lib/email/send-material-pull"
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/types/Profile"
import type { MaterialPullRequest, NotificationPreferences } from "@/types"

export type MaterialPullNotifyType =
  | "created"
  | "status_changed"
  | "batched"
  | "cancelled"

export interface MaterialPullNotifyPayload {
  type: MaterialPullNotifyType
  request: MaterialPullRequest
  actorProfileId: string
  previousStatus?: string
  batchCount?: number
  batchId?: string | null
}

type Recipient = {
  profileId: string
  email: string | null
  fullName: string
  prefs: NotificationPreferences
}

function parsePrefs(raw: unknown): NotificationPreferences {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_NOTIFICATION_PREFERENCES }
  const obj = raw as Record<string, unknown>
  return {
    job_updates_email:
      typeof obj.job_updates_email === "boolean"
        ? obj.job_updates_email
        : DEFAULT_NOTIFICATION_PREFERENCES.job_updates_email,
    task_assignments_email:
      typeof obj.task_assignments_email === "boolean"
        ? obj.task_assignments_email
        : DEFAULT_NOTIFICATION_PREFERENCES.task_assignments_email,
    material_request_push:
      typeof obj.material_request_push === "boolean"
        ? obj.material_request_push
        : DEFAULT_NOTIFICATION_PREFERENCES.material_request_push,
    material_request_email:
      typeof obj.material_request_email === "boolean"
        ? obj.material_request_email
        : DEFAULT_NOTIFICATION_PREFERENCES.material_request_email,
  }
}

async function loadOrgManagers(organizationId: string): Promise<Recipient[]> {
  if (!isAdminClientConfigured()) return []
  const admin = createAdminClient()
  const { data: profiles } = await admin
    .from(Tables.profiles)
    .select("id, full_name, user_id, notification_preferences, role")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .in("role", ["admin", "manager"])

  if (!profiles?.length) return []

  const recipients: Recipient[] = []
  for (const p of profiles) {
    const { data: userData } = await admin.auth.admin.getUserById(p.user_id)
    recipients.push({
      profileId: p.id,
      email: userData.user?.email ?? null,
      fullName: p.full_name ?? "Team member",
      prefs: parsePrefs(p.notification_preferences),
    })
  }
  return recipients
}

async function loadProfileRecipient(profileId: string): Promise<Recipient | null> {
  if (!isAdminClientConfigured()) return null
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from(Tables.profiles)
    .select("id, full_name, user_id, notification_preferences")
    .eq("id", profileId)
    .maybeSingle()

  if (!profile) return null
  const { data: userData } = await admin.auth.admin.getUserById(profile.user_id)
  return {
    profileId: profile.id,
    email: userData.user?.email ?? null,
    fullName: profile.full_name ?? "Team member",
    prefs: parsePrefs(profile.notification_preferences),
  }
}

function buildMessage(payload: MaterialPullNotifyPayload): {
  title: string
  body: string
  url: string
} {
  const { request, type, batchCount } = payload
  const url = `/pull?highlight=${request.id}`

  switch (type) {
    case "created":
      return {
        title: "New material pull request",
        body: `${request.jobNumber}: ${request.quantity} ${request.unit} ${request.material}`,
        url,
      }
    case "batched":
      return {
        title: "Pull list ready",
        body: `${batchCount ?? 1} item(s) batched — ${request.jobNumber} / ${request.material}`,
        url: `/pull/batch${request.batchId ? `?batch=${request.batchId}` : ""}`,
      }
    case "cancelled":
      return {
        title: "Material request cancelled",
        body: `${request.jobNumber}: ${request.material}`,
        url,
      }
    case "status_changed":
    default: {
      const labels: Record<string, string> = {
        pending: "Pending",
        sourced: "Sourced",
        batched: "Batched",
        pulled: "Pulled",
        cancelled: "Cancelled",
      }
      return {
        title: `Request ${labels[request.status] ?? request.status}`,
        body: `${request.jobNumber}: ${request.quantity} ${request.unit} ${request.material}`,
        url,
      }
    }
  }
}

async function resolveRecipients(
  payload: MaterialPullNotifyPayload
): Promise<Recipient[]> {
  const orgId = payload.request.organizationId
  const managers = await loadOrgManagers(orgId)
  const requester = await loadProfileRecipient(payload.request.requestedBy)

  const byId = new Map<string, Recipient>()

  if (payload.type === "created" || payload.type === "batched") {
    for (const m of managers) byId.set(m.profileId, m)
  }

  if (
    payload.type === "status_changed" ||
    payload.type === "cancelled"
  ) {
    if (requester) byId.set(requester.profileId, requester)
    if (payload.type === "cancelled") {
      for (const m of managers) byId.set(m.profileId, m)
    }
    if (payload.request.status === "batched") {
      for (const m of managers) byId.set(m.profileId, m)
    }
  }

  // Don't notify the actor about their own action
  byId.delete(payload.actorProfileId)

  return [...byId.values()]
}

export async function notifyMaterialPullEvent(
  payload: MaterialPullNotifyPayload
): Promise<void> {
  // Ensure we have org context even if called after mutation
  try {
    await createClient()
  } catch {
    /* ignore */
  }

  const recipients = await resolveRecipients(payload)
  if (recipients.length === 0) return

  const message = buildMessage(payload)
  const subs = await listPushSubscriptionsForProfiles(
    recipients.map((r) => r.profileId)
  )
  const subsByProfile = new Map<string, typeof subs>()
  for (const sub of subs) {
    const list = subsByProfile.get(sub.profile_id) ?? []
    list.push(sub)
    subsByProfile.set(sub.profile_id, list)
  }

  for (const recipient of recipients) {
    const profileSubs = subsByProfile.get(recipient.profileId) ?? []
    let pushSent = false

    if (recipient.prefs.material_request_push && profileSubs.length > 0) {
      for (const sub of profileSubs) {
        const ok = await sendWebPush(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          {
            title: message.title,
            body: message.body,
            url: message.url,
            tag: `mpr-${payload.request.id}`,
          }
        )
        if (ok === "gone") {
          await deletePushSubscriptionById(sub.id)
        } else if (ok === true) {
          pushSent = true
        }
      }
    }

    if (
      !pushSent &&
      recipient.prefs.material_request_email &&
      recipient.email
    ) {
      await sendMaterialPullEmail({
        to: recipient.email,
        fullName: recipient.fullName,
        title: message.title,
        body: message.body,
        urlPath: message.url,
      })
    }
  }
}
