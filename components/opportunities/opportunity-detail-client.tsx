"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Briefcase, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { StageBadge } from "@/components/status-badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateOpportunityAction } from "@/lib/actions/opportunities"
import { listOrgUsersForPickerAction } from "@/lib/actions/jobs"
import { ALL_STAGES, formatCloseDate, formatOppValue, isTerminalStage } from "@/lib/opportunities-config"
import { toast } from "@/lib/toast"
import type { LinkedJobSummary } from "@/lib/supabase/services/opportunities"
import type { Opportunity, OppStage, ProfileSummary } from "@/types"

interface OpportunityDetailClientProps {
  opportunity: Opportunity
  linkedJobs: LinkedJobSummary[]
  dataSource: "supabase" | "mock"
}

export function OpportunityDetailClient({
  opportunity: initial,
  linkedJobs,
  dataSource,
}: OpportunityDetailClientProps) {
  const router = useRouter()
  const [opp, setOpp] = useState(initial)
  const [title, setTitle] = useState(initial.title)
  const [value, setValue] = useState(String(initial.value || ""))
  const [stage, setStage] = useState<OppStage>(initial.stage)
  const [probability, setProbability] = useState(String(initial.probability))
  const [closeDate, setCloseDate] = useState(initial.closeDate || "")
  const [assigneeId, setAssigneeId] = useState(initial.assigneeId ?? "")
  const [notes, setNotes] = useState(initial.notes || "")
  const [winLossReason, setWinLossReason] = useState(initial.winLossReason || "")
  const [orgUsers, setOrgUsers] = useState<ProfileSummary[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (dataSource !== "supabase") return
    void listOrgUsersForPickerAction().then((result) => {
      if (result.data) setOrgUsers(result.data)
    })
  }, [dataSource])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Missing title", "Opportunity title is required.")
      return
    }
    if (isTerminalStage(stage) && !winLossReason.trim()) {
      toast.error("Win/loss reason required", "Add why this deal was won or lost.")
      return
    }
    if (dataSource === "mock") {
      toast.error("Supabase not configured", "Connect Supabase to save opportunities.")
      return
    }

    const owner = orgUsers.find((u) => u.id === assigneeId)

    setIsSaving(true)
    const result = await updateOpportunityAction(opp.id, {
      title: title.trim(),
      value: value ? Number(value) : 0,
      stage,
      probability: Number(probability) || 0,
      closeDate: closeDate || null,
      assigneeId: assigneeId || null,
      assignee: owner?.fullName ?? (assigneeId ? opp.assignee : null),
      notes: notes.trim() || null,
      winLossReason: isTerminalStage(stage) ? winLossReason.trim() : null,
    })
    setIsSaving(false)

    if (result.error) {
      toast.error("Could not save", result.error)
      return
    }

    if (result.data) {
      setOpp(result.data)
      toast.success("Opportunity saved")
      router.refresh()
    }
  }

  const createJobHref =
    stage === "Won"
      ? `/jobs/new?${new URLSearchParams({
          ...(opp.accountId ? { accountId: opp.accountId } : {}),
          opportunityId: opp.id,
          ...(opp.title ? { description: opp.title } : {}),
          ...(opp.value ? { value: String(opp.value) } : {}),
        }).toString()}`
      : null

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" render={<Link href="/opportunities" />}>
          <ArrowLeft className="size-4" />
          Back to opportunities
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground truncate">{opp.title}</h1>
              <StageBadge stage={opp.stage} />
            </div>
            <p className="text-sm text-muted-foreground">
              {opp.customer}
              {opp.closeDate ? ` · Close ${formatCloseDate(opp.closeDate)}` : ""}
              {` · ${formatOppValue(opp.value)}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {opp.accountId && (
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/customers?account=${opp.accountId}`} />}
              >
                Customer 360
              </Button>
            )}
            {createJobHref && (
              <Button
                size="sm"
                className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0"
                render={<Link href={createJobHref} />}
              >
                <Briefcase className="size-4" data-icon="inline-start" />
                Create job
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Opportunity details</CardTitle>
          <CardDescription>
            Owner, stage, and win/loss — same ownership pattern as relationship contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="opp-title">
                Title *
              </label>
              <Input
                id="opp-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Stage</label>
                <Select
                  value={stage}
                  onValueChange={(v) => {
                    if (v != null) setStage(v as OppStage)
                  }}
                >
                  <SelectTrigger className="w-full bg-background text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Owner</label>
                <Select
                  value={assigneeId || "__none__"}
                  onValueChange={(v) => {
                    if (v == null) return
                    setAssigneeId(v === "__none__" ? "" : v)
                  }}
                >
                  <SelectTrigger className="w-full bg-background text-foreground">
                    <SelectValue placeholder="Select owner…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {orgUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="opp-value">
                  Value ($)
                </label>
                <Input
                  id="opp-value"
                  type="number"
                  min={0}
                  step="any"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="opp-prob">
                  Probability (%)
                </label>
                <Input
                  id="opp-prob"
                  type="number"
                  min={0}
                  max={100}
                  value={probability}
                  onChange={(e) => setProbability(e.target.value)}
                  disabled={isTerminalStage(stage)}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium" htmlFor="opp-close">
                  Close date
                </label>
                <Input
                  id="opp-close"
                  type="date"
                  value={closeDate}
                  onChange={(e) => setCloseDate(e.target.value)}
                />
              </div>
            </div>

            {isTerminalStage(stage) && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="opp-win-loss">
                  Why {stage}? *
                </label>
                <textarea
                  id="opp-win-loss"
                  rows={2}
                  value={winLossReason}
                  onChange={(e) => setWinLossReason(e.target.value)}
                  placeholder={
                    stage === "Won"
                      ? "e.g. Best price + lead time on crossarms"
                      : "e.g. Lost to competitor on delivery"
                  }
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs resize-y min-h-[72px]"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="opp-notes">
                Notes
              </label>
              <textarea
                id="opp-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs resize-y min-h-[80px]"
              />
            </div>

            <Button type="submit" disabled={isSaving || dataSource !== "supabase"}>
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {linkedJobs.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Linked jobs</CardTitle>
            <CardDescription>Jobs created from this opportunity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {linkedJobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {job.jobNumber} · {job.description}
                  </p>
                  <p className="text-xs text-muted-foreground">{job.status}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
