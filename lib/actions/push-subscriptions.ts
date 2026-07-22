"use server"

import { requireSessionContext } from "@/lib/auth/session"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { SupabaseServiceError } from "@/lib/supabase/schema"
import {
  deletePushSubscription,
  savePushSubscription,
} from "@/lib/supabase/services/push-subscriptions"
import { getVapidPublicKey, isWebPushConfigured } from "@/lib/push/web-push"

async function safeAction<T>(fn: () => Promise<T>): Promise<{ data?: T; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured" }
  }
  try {
    const data = await fn()
    return { data }
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

export async function getVapidPublicKeyAction() {
  return {
    data: {
      publicKey: getVapidPublicKey(),
      configured: isWebPushConfigured(),
    },
  }
}

export async function savePushSubscriptionAction(input: {
  endpoint: string
  p256dh: string
  auth: string
  userAgent?: string | null
}) {
  return safeAction(async () => {
    const ctx = await requireSessionContext()
    if (!input.endpoint || !input.p256dh || !input.auth) {
      throw new Error("Invalid push subscription")
    }
    return savePushSubscription({
      ...input,
      profileId: ctx.profileId,
    })
  })
}

export async function deletePushSubscriptionAction(endpoint: string) {
  return safeAction(async () => {
    await requireSessionContext()
    await deletePushSubscription(endpoint)
    return { ok: true as const }
  })
}
