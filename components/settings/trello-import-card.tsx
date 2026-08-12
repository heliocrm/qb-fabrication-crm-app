"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, RefreshCw, Kanban } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrelloImportDialog } from "@/components/settings/trello-import-dialog"
import {
  getTrelloStatusAction,
  refreshTrelloJobsAction,
} from "@/lib/actions/trello-import"
import { toast } from "@/lib/toast"

type Status = {
  configured: boolean
  allowlistSet: boolean
}

interface TrelloImportCardProps {
  canManage: boolean
}

export function TrelloImportCard({ canManage }: TrelloImportCardProps) {
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const reload = useCallback(async () => {
    if (!canManage) {
      setLoading(false)
      setStatus(null)
      return
    }
    setLoading(true)
    const result = await getTrelloStatusAction()
    setLoading(false)
    if (result.error) {
      toast.error("Could not load Trello status", result.error)
      return
    }
    if (result.data) setStatus(result.data)
  }, [canManage])

  useEffect(() => {
    void reload()
  }, [reload])

  async function handleRefresh() {
    setRefreshing(true)
    const result = await refreshTrelloJobsAction()
    setRefreshing(false)
    if (result.error) {
      toast.error("Trello refresh failed", result.error)
      return
    }
    const data = result.data
    const errNote =
      data && data.errors.length > 0
        ? ` (${data.errors.length} board error${data.errors.length === 1 ? "" : "s"})`
        : ""
    toast.success(
      "Trello refresh complete",
      `${data?.jobsRefreshed ?? 0} jobs · ${data?.cardsUpserted ?? 0} cards · ${data?.tasksUpserted ?? 0} tasks${errNote}`
    )
    if (data && (data.orphanedLineItems > 0 || data.orphanedTasks > 0)) {
      toast.info(
        "Orphans left in CRM",
        `${data.orphanedLineItems} line items and ${data.orphanedTasks} tasks no longer on Trello (not deleted)`
      )
    }
  }

  if (!canManage) {
    return (
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Kanban className="size-4" />
            Trello
          </CardTitle>
          <CardDescription>
            Managers and admins can import boards into Jobs. Ask a manager if you
            need a board pulled in.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Kanban className="size-4" />
            Trello
          </CardTitle>
          <CardDescription>
            One-way import and refresh: boards → jobs, cards → line items,
            checklists → tasks. Does not write back to Trello.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Checking configuration…
            </p>
          ) : !status?.configured ? (
            <p className="text-sm text-muted-foreground">
              Set <code className="text-xs">TRELLO_API_KEY</code> and{" "}
              <code className="text-xs">TRELLO_TOKEN</code> on the server — see{" "}
              <span className="font-medium">docs/trello-import.md</span>.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Credentials configured
                {status.allowlistSet
                  ? " · board allowlist active (TRELLO_BOARD_IDS)"
                  : " · all boards visible to the token"}
                .
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => setImportOpen(true)}>
                  Import boards
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleRefresh()}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  Refresh imported jobs
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <TrelloImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onCommitted={() => void reload()}
      />
    </>
  )
}
