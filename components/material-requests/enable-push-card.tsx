"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  deletePushSubscriptionAction,
  getVapidPublicKeyAction,
  savePushSubscriptionAction,
} from "@/lib/actions/push-subscriptions"
import { toast } from "@/lib/toast"

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function EnablePushCard() {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default"
  )
  const [subscribed, setSubscribed] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    setSupported(ok)
    if (ok) {
      setPermission(Notification.permission)
    } else {
      setPermission("unsupported")
    }

    void getVapidPublicKeyAction().then((res) => {
      setConfigured(Boolean(res.data?.configured && res.data.publicKey))
    })

    if (ok && navigator.serviceWorker) {
      void navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription()
        setSubscribed(Boolean(sub))
      })
    }
  }, [])

  async function enable() {
    if (!supported) {
      toast.error(
        "Not supported",
        "Install this app to your home screen (required on iPhone) then try again."
      )
      return
    }

    setBusy(true)
    try {
      const keyRes = await getVapidPublicKeyAction()
      const publicKey = keyRes.data?.publicKey
      if (!keyRes.data?.configured || !publicKey) {
        toast.error(
          "Push not configured",
          "Ask an admin to set VAPID keys. Email alerts still work if Resend is set."
        )
        setBusy(false)
        return
      }

      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== "granted") {
        toast.error("Permission denied", "Enable notifications in browser settings.")
        setBusy(false)
        return
      }

      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
      }

      const json = sub.toJSON()
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Invalid subscription")
      }

      const result = await savePushSubscriptionAction({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        userAgent: navigator.userAgent,
      })

      if (result.error) {
        toast.error("Could not save subscription", result.error)
      } else {
        setSubscribed(true)
        toast.success("Notifications enabled")
      }
    } catch (err) {
      toast.error(
        "Enable failed",
        err instanceof Error ? err.message : "Try installing the app first."
      )
    }
    setBusy(false)
  }

  async function disable() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await deletePushSubscriptionAction(sub.endpoint)
        await sub.unsubscribe()
      }
      setSubscribed(false)
      toast.success("Notifications disabled")
    } catch {
      toast.error("Could not disable notifications")
    }
    setBusy(false)
  }

  if (!supported) {
    return (
      <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Enable alerts</p>
        On iPhone: Share → Add to Home Screen, open the app, then enable notifications.
        Android/Chrome: use Install / Add to Home Screen, then Enable below once available.
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-3 flex items-start gap-3">
      <div className="mt-0.5 text-[var(--orange)]">
        {subscribed ? <Bell className="size-5" /> : <BellOff className="size-5" />}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium">
          {subscribed ? "Alerts on" : "Enable notifications"}
        </p>
        <p className="text-xs text-muted-foreground">
          {configured
            ? "Get pinged when requests are submitted, batched, or pulled."
            : "Push keys not set yet — email fallback still works when Resend is configured."}
        </p>
        {permission === "denied" ? (
          <p className="text-xs text-destructive">
            Notifications blocked in browser settings.
          </p>
        ) : null}
      </div>
      <Button
        type="button"
        size="sm"
        variant={subscribed ? "outline" : "default"}
        className="min-h-11 min-w-20 touch-manipulation shrink-0"
        disabled={busy}
        onClick={subscribed ? disable : enable}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        {subscribed ? "Off" : "Enable"}
      </Button>
    </div>
  )
}
