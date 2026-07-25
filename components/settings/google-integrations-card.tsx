"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Mail, Plug } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  disconnectGoogleAction,
  getGoogleConnectionStatusAction,
  syncCalendarNowAction,
  syncGmailNowAction,
} from "@/lib/actions/google-crm"
import { toast } from "@/lib/toast"

type Status = {
  configured: boolean
  connected: boolean
  email: string | null
  lastGmailSyncAt: string | null
  lastCalendarSyncAt: string | null
}

function formatSync(iso: string | null): string {
  if (!iso) return "Never"
  return new Date(iso).toLocaleString()
}

export function GoogleIntegrationsCard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<"gmail" | "calendar" | "disconnect" | null>(
    null
  )

  const reload = useCallback(async () => {
    setLoading(true)
    const result = await getGoogleConnectionStatusAction()
    setLoading(false)
    if (result.error) {
      toast.error("Could not load Google status", result.error)
      return
    }
    if (result.data) setStatus(result.data)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    const google = searchParams.get("google")
    if (!google) return
    if (google === "connected") {
      toast.success("Google connected", "Gmail and Calendar sync are ready.")
      void reload()
    } else if (google === "error") {
      toast.error(
        "Google connection failed",
        searchParams.get("message") || "Unknown error"
      )
    }
    router.replace("/settings", { scroll: false })
  }, [searchParams, router, reload])

  async function handleSyncGmail() {
    setBusy("gmail")
    const result = await syncGmailNowAction()
    setBusy(null)
    if (result.error) {
      toast.error("Gmail sync failed", result.error)
      return
    }
    toast.success(
      "Gmail synced",
      `${result.data?.activitiesUpserted ?? 0} activities from ${result.data?.threadsScanned ?? 0} threads`
    )
    void reload()
  }

  async function handleSyncCalendar() {
    setBusy("calendar")
    const result = await syncCalendarNowAction()
    setBusy(null)
    if (result.error) {
      toast.error("Calendar sync failed", result.error)
      return
    }
    toast.success(
      "Calendar synced",
      `${result.data?.activitiesUpserted ?? 0} meetings from ${result.data?.eventsScanned ?? 0} events`
    )
    void reload()
  }

  async function handleDisconnect() {
    setBusy("disconnect")
    const result = await disconnectGoogleAction()
    setBusy(null)
    if (result.error) {
      toast.error("Disconnect failed", result.error)
      return
    }
    toast.success("Google disconnected")
    void reload()
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Plug className="size-4" />
          Integrations
        </CardTitle>
        <CardDescription>
          Connect your Google Workspace account for Gmail and Calendar CRM sync.
          Drive file storage stays on the shared service account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading || !status ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        ) : !status.configured ? (
          <p className="text-sm text-muted-foreground">
            Google OAuth is not configured on this environment. Set{" "}
            <code className="text-xs">GOOGLE_OAUTH_*</code> and{" "}
            <code className="text-xs">GOOGLE_TOKEN_ENCRYPTION_KEY</code> — see{" "}
            <span className="font-medium">docs/google-oauth-crm.md</span>.
          </p>
        ) : !status.connected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect Gmail (read) and Calendar (events) for this user. Tokens
              are encrypted at rest and separate from login with Google.
            </p>
            <Button render={<a href="/api/google/oauth/start" />}>
              <Mail className="size-4" data-icon="inline-start" />
              Connect Google
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <p className="font-medium text-foreground">
                Connected as {status.email}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Last Gmail sync: {formatSync(status.lastGmailSyncAt)}
              </p>
              <p className="text-xs text-muted-foreground">
                Last Calendar sync: {formatSync(status.lastCalendarSyncAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => void handleSyncGmail()}
                disabled={busy !== null}
              >
                {busy === "gmail" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Sync Gmail now"
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleSyncCalendar()}
                disabled={busy !== null}
              >
                {busy === "calendar" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Sync Calendar now"
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void handleDisconnect()}
                disabled={busy !== null}
              >
                {busy === "disconnect" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Disconnect"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
