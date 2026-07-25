"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createOpportunityAction } from "@/lib/actions/opportunities"
import { listOrgUsersForPickerAction } from "@/lib/actions/jobs"
import { ALL_STAGES, isTerminalStage } from "@/lib/opportunities-config"
import { toast } from "@/lib/toast"
import type { Account, OppStage, ProfileSummary } from "@/types"

interface CreateOpportunityFormProps {
  accounts: Account[]
  dataSource: "supabase" | "mock"
}

export function CreateOpportunityForm({
  accounts,
  dataSource,
}: CreateOpportunityFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "")
  const [stage, setStage] = useState<OppStage>("Prospecting")
  const [title, setTitle] = useState("")
  const [value, setValue] = useState("")
  const [probability, setProbability] = useState("10")
  const [closeDate, setCloseDate] = useState("")
  const [assigneeId, setAssigneeId] = useState("")
  const [winLossReason, setWinLossReason] = useState("")
  const [notes, setNotes] = useState("")
  const [orgUsers, setOrgUsers] = useState<ProfileSummary[]>([])

  useEffect(() => {
    if (dataSource !== "supabase") return
    void listOrgUsersForPickerAction().then((result) => {
      if (result.data) setOrgUsers(result.data)
    })
  }, [dataSource])

  async function handleSubmit(e: React.FormEvent) {
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
      toast.error("Supabase not configured", "Connect Supabase to create opportunities.")
      return
    }

    const owner = orgUsers.find((u) => u.id === assigneeId)

    setIsSubmitting(true)
    const result = await createOpportunityAction({
      title: title.trim(),
      accountId: accountId || null,
      value: value ? Number(value) : 0,
      stage,
      probability: Number(probability) || 10,
      closeDate: closeDate || null,
      assigneeId: assigneeId || null,
      assignee: owner?.fullName ?? null,
      notes: notes.trim() || null,
      winLossReason: isTerminalStage(stage) ? winLossReason.trim() : null,
    })
    setIsSubmitting(false)

    if (result.error) {
      toast.error("Could not create opportunity", result.error)
      return
    }

    toast.success("Opportunity created")
    if (result.data) {
      router.push(`/opportunities/${result.data.id}`)
    } else {
      router.push("/opportunities")
    }
    router.refresh()
  }

  return (
    <Card className="border shadow-sm max-w-2xl">
      <CardHeader>
        <CardTitle>New opportunity</CardTitle>
        <CardDescription>Add a bid to the sales pipeline</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="opp-title">
              Title *
            </label>
            <Input
              id="opp-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. BPA Crossarm package — McNary"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Customer</label>
              <Select
                value={accountId}
                onValueChange={(v) => {
                  if (v != null) setAccountId(v)
                }}
              >
                <SelectTrigger className="w-full bg-background text-foreground">
                  <SelectValue placeholder="Select customer…" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <div className="space-y-1.5">
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
                    ? "e.g. Best price + lead time"
                    : "e.g. Lost on delivery"
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

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create opportunity"
              )}
            </Button>
            <Button type="button" variant="outline" render={<Link href="/opportunities" />}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
