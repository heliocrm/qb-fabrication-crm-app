"use client"

import { useState } from "react"
import { DollarSign, Plus, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { opportunities, type Opportunity, type OppStage } from "@/lib/mock-data"
import { StageBadge } from "@/components/status-badge"
import { cn } from "@/lib/utils"

const STAGES: OppStage[] = ["Prospecting", "Qualification", "Estimating", "Proposal", "Negotiation", "Won", "Lost"]

const stageColors: Record<OppStage, string> = {
  Prospecting:   "border-t-slate-400",
  Qualification: "border-t-blue-400",
  Estimating:    "border-t-sky-500",
  Proposal:      "border-t-purple-500",
  Negotiation:   "border-t-amber-500",
  Won:           "border-t-green-500",
  Lost:          "border-t-red-400",
}

function fmt(n: number) {
  return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${(n / 1_000).toFixed(0)}K`
}

function ProbabilityPip({ pct }: { pct: number }) {
  const color = pct >= 75 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-slate-400"
  return (
    <div className="flex items-center gap-1.5">
      <div className={`size-2 rounded-full ${color}`} />
      <span className="text-xs text-muted-foreground">{pct}%</span>
    </div>
  )
}

function OppCard({ opp, onMove }: { opp: Opportunity; onMove: (id: string, stage: OppStage) => void }) {
  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow group">
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-start justify-between gap-1">
          <p className="text-xs font-semibold text-foreground leading-snug flex-1">{opp.title}</p>
        </div>

        <p className="text-xs text-muted-foreground">{opp.customer.split(" ").slice(0, 3).join(" ")}</p>

        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">{fmt(opp.value)}</span>
          <ProbabilityPip pct={opp.probability} />
        </div>

        <Progress value={opp.probability} className="h-1" />

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Avatar className="size-5">
              <AvatarFallback className="text-[8px] font-bold bg-[var(--orange)] text-white">
                {opp.assignee.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {new Date(opp.closeDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {STAGES.filter((s) => s !== opp.stage).slice(0, 2).map((s) => (
              <button
                key={s}
                onClick={() => onMove(opp.id, s)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted-foreground/20 text-muted-foreground transition-colors"
              >
                → {s.slice(0, 4)}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function OpportunitiesPage() {
  const [opps, setOpps] = useState(opportunities)

  const moveOpp = (id: string, newStage: OppStage) => {
    setOpps((prev) => prev.map((o) => (o.id === id ? { ...o, stage: newStage } : o)))
  }

  const totalPipeline = opps
    .filter((o) => !["Won", "Lost"].includes(o.stage))
    .reduce((s, o) => s + o.value * (o.probability / 100), 0)

  const totalActive = opps
    .filter((o) => !["Won", "Lost"].includes(o.stage))
    .reduce((s, o) => s + o.value, 0)

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Opportunities</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Sales pipeline — drag cards to update stage</p>
        </div>
        <Button size="sm" className="gap-1.5 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0">
          <Plus className="size-4" data-icon="inline-start" />
          New Opportunity
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Opps", value: opps.filter((o) => !["Won", "Lost"].includes(o.stage)).length.toString(), icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
          { label: "Total Pipeline", value: fmt(totalActive), icon: DollarSign, color: "text-[var(--orange)] bg-[var(--orange-muted)]" },
          { label: "Weighted Value", value: fmt(totalPipeline), icon: TrendingUp, color: "text-green-600 bg-green-50" },
          { label: "Won YTD", value: fmt(opps.filter((o) => o.stage === "Won").reduce((s, o) => s + o.value, 0)), icon: DollarSign, color: "text-green-600 bg-green-50" },
        ].map((m) => (
          <Card key={m.label} className="border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${m.color}`}>
                <m.icon className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-lg font-bold text-foreground">{m.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageOpps = opps.filter((o) => o.stage === stage)
          const stageValue = stageOpps.reduce((s, o) => s + o.value, 0)
          const isTerminal = stage === "Won" || stage === "Lost"

          return (
            <div key={stage} className="flex flex-col gap-3 min-w-60 w-60 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{stage}</span>
                  <Badge variant="secondary" className="px-1.5 py-0 text-xs">{stageOpps.length}</Badge>
                </div>
                {stageValue > 0 && (
                  <span className="text-xs text-muted-foreground font-medium">{fmt(stageValue)}</span>
                )}
              </div>

              <div
                className={cn(
                  "flex flex-col gap-3 rounded-xl p-3 border-t-4 min-h-28",
                  isTerminal ? "bg-muted/20" : "bg-muted/30",
                  stageColors[stage]
                )}
              >
                {stageOpps.map((opp) => (
                  <OppCard key={opp.id} opp={opp} onMove={moveOpp} />
                ))}
                {stageOpps.length === 0 && (
                  <div className="flex items-center justify-center h-16 text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
                    No opportunities
                  </div>
                )}
                {!isTerminal && (
                  <button className="text-xs text-muted-foreground flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-border hover:border-[var(--orange)] hover:text-[var(--orange)] transition-colors">
                    <Plus className="size-3" />
                    Add
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
