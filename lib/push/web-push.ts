import webpush from "web-push"

export function isWebPushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
  )
}

function ensureVapid(): boolean {
  if (!isWebPushConfigured()) return false
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  return true
}

export type PushPayload = {
  title: string
  body: string
  url?: string
  tag?: string
}

/** Returns true if sent, false if skipped/failed, "gone" if subscription expired */
export async function sendWebPush(
  subscription: {
    endpoint: string
    keys: { p256dh: string; auth: string }
  },
  payload: PushPayload
): Promise<true | false | "gone"> {
  if (!ensureVapid()) return false

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url ?? "/pull",
        tag: payload.tag,
      })
    )
    return true
  } catch (err) {
    const status =
      err && typeof err === "object" && "statusCode" in err
        ? Number((err as { statusCode: number }).statusCode)
        : 0
    if (status === 404 || status === 410) return "gone"
    console.error("[web-push]", err)
    return false
  }
}

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null
}
