"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { CalendarClock, Loader2, StickyNote } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  listNeedsTouchAction,
  logTouchFromQueueAction,
  setNextTouchFromQueueAction,
} from "@/lib/actions/needs-touch"
import { toast } from "@/lib/toast"
import type { NeedsTouchRow } from "@/lib/supabase/services/needs-touch"

export function NeedsTouchPageClient() {
  const [scope, setScope] = useState<"mine" | "all">("mine")
  const [canViewAll, setCanViewAll] = useState(false)
  const [rows, setRows] = useState<NeedsTouchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [logRow, setLogRow] = useState<NeedsTouchRow | null>(null)
  const [logBody, setLogBody] = useState("")
  const [nextRow, setNextRow] = useState<NeedsTouchRow | null>(null)
  const [nextDate, setNextDate] = useState("")
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    const result = await listNeedsTouchAction(scope)
    setLoading(false)
    if (result.error) {
      toast.error("Could not load queue", result.error)
      return
    }
    if (result.data) {
      setRows(result.data.rows)
      setCanViewAll(result.data.canViewAll)
      if (result.data.scope !== scope) {
        setScope(result.data.scope as "mine" | "all")
      }
    }
  }, [scope])

  useEffect(() => {
    void reload()
  }, [reload])

  async function submitLog() {
    if (!logRow || !logBody.trim()) return
    setSaving(true)
    const result = await logTouchFromQueueAction({
      contactId: logRow.contact.id,
      accountId: logRow.accountId,
      body: logBody.trim(),
    })
    setSaving(false)
    if (result.error) {
      toast.error("Could not log touch", result.error)
      return
    }
    toast.success("Touch logged")
    setLogRow(null)
    setLogBody("")
    void reload()
  }

  async function submitNext() {
    if (!nextRow) return
    setSaving(true)
    const result = await setNextTouchFromQueueAction({
      contactId: nextRow.contact.id,
      nextTouchAt: nextDate
        ? new Date(`${nextDate}T12:00:00`).toISOString()
        : null,
    })
    setSaving(false)
    if (result.error) {
      toast.error("Could not update next touch", result.error)
      return
    }
    toast.success("Next touch updated")
    setNextRow(null)
    setNextDate("")
    void reload()
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Needs a touch</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Due follow-ups and contacts dormant 90+ days. Assign owners on
            Customer 360 if your queue is empty.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={scope}
            onValueChange={(v) => {
              if (v === "mine" || (v === "all" && canViewAll)) {
                setScope(v)
              }
            }}
          >
            <SelectTrigger className="w-40 bg-background text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mine">My queue</SelectItem>
              {canViewAll ? (
                <SelectItem value="all">All</SelectItem>
              ) : null}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" render={<Link href="/customers" />}>
            Customers
          </Button>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="size-4" />
            Queue
            {!loading ? (
              <Badge variant="secondary" className="ml-1">
                {rows.length}
              </Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 px-4 text-center space-y-2">
              <p className="text-sm font-medium text-foreground">
                {scope === "mine"
                  ? "No owned contacts in your queue"
                  : "No contacts need a touch right now"}
              </p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {scope === "mine"
                  ? "Assign yourself as relationship owner on Customer 360, or switch to All (managers/admins) to see unowned and team contacts."
                  : "When next-touch dates come due or last contact is older than 90 days, contacts appear here."}
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {rows.map((row) => (
                <li
                  key={row.contact.id}
                  className="py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold truncate">
                        {row.contact.fullName}
                      </p>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {row.reason === "next_touch_due"
                          ? "Next touch due"
                          : "Dormant 90d+"}
                      </Badge>
                      {row.openJobCount > 0 ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {row.openJobCount} open job
                          {row.openJobCount === 1 ? "" : "s"}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {row.accountName}
                      {row.contact.email ? ` · ${row.contact.email}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.contact.nextTouchAt
                        ? `Next: ${new Date(row.contact.nextTouchAt).toLocaleDateString()}`
                        : "No next touch set"}
                      {row.contact.lastContactAt
                        ? ` · Last: ${new Date(row.contact.lastContactAt).toLocaleDateString()}`
                        : " · No last contact"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      render={
                        <Link href={`/customers?account=${row.accountId}`} />
                      }
                    >
                      Open 360
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setLogRow(row)
                        setLogBody("")
                      }}
                    >
                      <StickyNote className="size-3.5" data-icon="inline-start" />
                      Log touch
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNextRow(row)
                        setNextDate(
                          row.contact.nextTouchAt?.slice(0, 10) ?? ""
                        )
                      }}
                    >
                      Set next
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(logRow)}
        onOpenChange={(o) => {
          if (!o) setLogRow(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Log touch{logRow ? ` — ${logRow.contact.fullName}` : ""}
            </DialogTitle>
          </DialogHeader>
          <textarea
            value={logBody}
            onChange={(e) => setLogBody(e.target.value)}
            rows={3}
            placeholder="What did you cover?"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs resize-y"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogRow(null)}>
              Cancel
            </Button>
            <Button onClick={() => void submitLog()} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(nextRow)}
        onOpenChange={(o) => {
          if (!o) setNextRow(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Set next touch{nextRow ? ` — ${nextRow.contact.fullName}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Clear the date to remove the next-touch reminder.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNextDate("")
              }}
            >
              Clear date
            </Button>
            <Button onClick={() => void submitNext()} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
