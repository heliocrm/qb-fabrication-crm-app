"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  FileText,
  Loader2,
  MessageSquare,
  Upload,
  Wrench,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createCrmActivityAction,
  listJobCrmActivitiesAction,
} from "@/lib/actions/crm-activities"
import { toast } from "@/lib/toast"
import type { Activity, CrmActivity, CrmActivityKind, Job } from "@/types"

interface JobActivityTabProps {
  job: Job
  canWrite?: boolean
}

type FeedItem =
  | { source: "system"; at: number; activity: Activity }
  | { source: "crm"; at: number; activity: CrmActivity }

function activityIcon(action: string) {
  if (action.toLowerCase().includes("upload")) return Upload
  if (action.toLowerCase().includes("change order")) return FileText
  if (action.toLowerCase().includes("task") || action.toLowerCase().includes("complete"))
    return Wrench
  return MessageSquare
}

export function JobActivityTab({ job, canWrite = false }: JobActivityTabProps) {
  const [crmItems, setCrmItems] = useState<CrmActivity[]>([])
  const [noteBody, setNoteBody] = useState("")
  const [noteKind, setNoteKind] = useState<CrmActivityKind>("note")
  const [saving, setSaving] = useState(false)

  const reloadCrm = useCallback(async () => {
    const res = await listJobCrmActivitiesAction(job.id)
    if (res.error) {
      toast.error("Could not load notes", res.error)
      return
    }
    if (res.data) setCrmItems(res.data)
  }, [job.id])

  useEffect(() => {
    void reloadCrm()
  }, [reloadCrm])

  const feed = useMemo(() => {
    const system: FeedItem[] = (job.activity ?? []).map((a) => ({
      source: "system" as const,
      at: new Date(a.timestamp).getTime() || 0,
      activity: a,
    }))
    const crm: FeedItem[] = crmItems.map((a) => ({
      source: "crm" as const,
      at: new Date(a.occurredAt).getTime() || 0,
      activity: a,
    }))
    return [...system, ...crm].sort((a, b) => b.at - a.at)
  }, [job.activity, crmItems])

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteBody.trim()) return
    setSaving(true)
    const result = await createCrmActivityAction({
      jobId: job.id,
      accountId: job.accountId ?? null,
      kind: noteKind,
      body: noteBody.trim(),
    })
    setSaving(false)
    if (result.error) {
      toast.error("Could not save note", result.error)
      return
    }
    setNoteBody("")
    toast.success("Note added")
    void reloadCrm()
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">Activity Log</p>
        <p className="text-xs text-muted-foreground">
          System events and manual notes — newest first
        </p>
      </div>

      {canWrite ? (
        <Card className="border shadow-sm">
          <CardContent className="pt-4 space-y-2">
            <form onSubmit={handleAddNote} className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Select
                  value={noteKind}
                  onValueChange={(v) => {
                    if (v != null) setNoteKind(v as CrmActivityKind)
                  }}
                >
                  <SelectTrigger className="w-32 bg-background text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="touch">Touch</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Add note"
                  )}
                </Button>
              </div>
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={2}
                placeholder="Site visit, customer call, schedule note…"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs resize-y min-h-[60px]"
              />
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            {feed.length} event{feed.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feed.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No activity recorded yet.
            </p>
          ) : (
            <div className="relative space-y-0">
              {feed.map((item, i) => {
                const isLast = i === feed.length - 1
                if (item.source === "system") {
                  const act = item.activity
                  const Icon = activityIcon(act.action)
                  return (
                    <div key={`sys-${act.id}`} className="flex gap-4 pb-6 relative">
                      {!isLast && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                      )}
                      <div className="relative shrink-0">
                        <Avatar className="size-8 border-2 border-background">
                          <AvatarFallback className="text-[10px] font-bold bg-[var(--orange)] text-white">
                            {act.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-card border flex items-center justify-center">
                          <Icon className="size-2.5 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm">
                          <span className="font-semibold text-foreground">{act.user}</span>{" "}
                          <span className="text-muted-foreground">{act.action}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                          {act.timestamp}
                        </p>
                      </div>
                    </div>
                  )
                }

                const act = item.activity
                return (
                  <div key={`crm-${act.id}`} className="flex gap-4 pb-6 relative">
                    {!isLast && (
                      <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                    )}
                    <div className="relative shrink-0">
                      <Avatar className="size-8 border-2 border-background">
                        <AvatarFallback className="text-[10px] font-bold bg-muted text-foreground">
                          {(act.createdByName ?? "N").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-card border flex items-center justify-center">
                        <MessageSquare className="size-2.5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">
                          {act.createdByName ?? "Team"}
                        </span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {act.kind}
                        </Badge>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{act.body}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {new Date(act.occurredAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
