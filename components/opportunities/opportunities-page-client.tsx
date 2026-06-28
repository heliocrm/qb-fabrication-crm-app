"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { DollarSign, Grid3X3, List, Plus, Search, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { OpportunityKanban } from "@/components/opportunities/opportunity-kanban"
import { OpportunityList } from "@/components/opportunities/opportunity-list"
import { formatOppValue, isTerminalStage } from "@/lib/opportunities-config"
import { updateOpportunityStageAction } from "@/lib/actions/opportunities"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Opportunity, OppStage } from "@/types"

interface OpportunitiesPageClientProps {
  initialOpportunities: Opportunity[]
  dataSource?: "supabase" | "mock"
  loadError?: string
}

export function OpportunitiesPageClient({
  initialOpportunities,
  dataSource,
  loadError,
}: OpportunitiesPageClientProps) {
  const [opps, setOpps] = useState<Opportunity[]>(initialOpportunities)
  const [view, setView] = useState<"kanban" | "list">("kanban")
  const [search, setSearch] = useState("")
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (loadError) {
      toast.error("Could not load opportunities", loadError)
    }
  }, [loadError])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return opps
    return opps.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.stage.toLowerCase().includes(q) ||
        o.assignee.toLowerCase().includes(q)
    )
  }, [opps, search])

  const activeOpps = filtered.filter((o) => !isTerminalStage(o.stage))
  const totalActive = activeOpps.reduce((s, o) => s + o.value, 0)
  const weightedValue = activeOpps.reduce(
    (s, o) => s + o.value * (o.probability / 100),
    0
  )
  const wonYtd = filtered
    .filter((o) => o.stage === "Won")
    .reduce((s, o) => s + o.value, 0)

  const handleStageChange = useCallback(
    (id: string, stage: OppStage) => {
      let snapshot: Opportunity[] | null = null
      let oppTitle = ""

      setOpps((prev) => {
        const opp = prev.find((o) => o.id === id)
        if (!opp || opp.stage === stage) return prev

        snapshot = prev
        oppTitle = opp.title
        const probability =
          stage === "Won" ? 100 : stage === "Lost" ? 0 : opp.probability

        return prev.map((o) =>
          o.id === id ? { ...o, stage, probability } : o
        )
      })

      if (!snapshot) return

      if (dataSource === "supabase") {
        setPendingIds((prev) => new Set(prev).add(id))

        void updateOpportunityStageAction(id, stage).then((result) => {
          setPendingIds((prev) => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })

          if (result.error) {
            setOpps(snapshot!)
            toast.error("Could not update stage", result.error)
            return
          }

          toast.success(`Moved to ${stage}`, oppTitle)
        })
      } else {
        toast.success(`Moved to ${stage}`, oppTitle)
      }
    },
    [dataSource]
  )

  const showEmptyState =
    !loadError && filtered.length === 0 && opps.length === 0

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Opportunities</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sales pipeline — drag cards between stages or switch to list view
            {dataSource === "supabase" && (
              <span className="ml-1 text-[var(--orange)]">· live data</span>
            )}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0 w-fit"
        >
          <Plus className="size-4" data-icon="inline-start" />
          New Opportunity
        </Button>
      </div>

      {loadError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Could not load opportunities: {loadError}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: "Active Opps",
            value: String(activeOpps.length),
            icon: TrendingUp,
            color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
          },
          {
            label: "Total Pipeline",
            value: formatOppValue(totalActive),
            icon: DollarSign,
            color: "text-[var(--orange)] bg-[var(--orange-muted)] dark:bg-[var(--orange)]/10",
          },
          {
            label: "Weighted Value",
            value: formatOppValue(weightedValue),
            icon: TrendingUp,
            color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40",
          },
          {
            label: "Won YTD",
            value: formatOppValue(wonYtd),
            icon: DollarSign,
            color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40",
          },
        ].map((m) => (
          <Card key={m.label} className="border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg shrink-0", m.color)}>
                <m.icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{m.label}</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{m.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <label htmlFor="opp-search" className="sr-only">
            Search opportunities
          </label>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <Input
            id="opp-search"
            placeholder="Search opportunities…"
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/30 w-fit">
          <Button
            variant={view === "kanban" ? "secondary" : "ghost"}
            size="icon"
            className="size-9 sm:size-7"
            onClick={() => setView("kanban")}
            aria-label="Kanban view"
          >
            <Grid3X3 className="size-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            className="size-9 sm:size-7"
            onClick={() => setView("list")}
            aria-label="List view"
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {showEmptyState ? (
        <Card className="border shadow-sm">
          <div className="py-16 text-center text-sm text-muted-foreground">
            No opportunities yet. Create one to start building your pipeline.
          </div>
        </Card>
      ) : view === "kanban" ? (
        <OpportunityKanban
          opportunities={filtered}
          onStageChange={handleStageChange}
          pendingIds={pendingIds}
        />
      ) : (
        <OpportunityList opportunities={filtered} />
      )}
    </div>
  )
}
