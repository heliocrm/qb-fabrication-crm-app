"use client"

import { useDroppable } from "@dnd-kit/core"
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { OpportunityCard } from "@/components/opportunities/opportunity-card"
import { cn } from "@/lib/utils"
import {
  stageColors,
  formatOppValue,
  isTerminalStage,
} from "@/lib/opportunities-config"
import type { Opportunity, OppStage } from "@/types"

interface KanbanColumnProps {
  stage: OppStage
  label?: string
  opportunities: Opportunity[]
  compact?: boolean
  pendingIds?: Set<string>
}

export function KanbanColumn({
  stage,
  label,
  opportunities,
  compact,
  pendingIds,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const stageValue = opportunities.reduce((sum, o) => sum + o.value, 0)
  const terminal = isTerminalStage(stage)

  return (
    <div className={cn("flex flex-col gap-2 shrink-0", compact ? "min-w-52 w-52" : "min-w-64 w-64")}>
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">
            {label ?? stage}
          </span>
          <Badge variant="secondary" className="px-1.5 py-0 text-xs shrink-0">
            {opportunities.length}
          </Badge>
        </div>
        {stageValue > 0 && (
          <span className="text-xs text-muted-foreground font-medium tabular-nums shrink-0 ml-1">
            {formatOppValue(stageValue)}
          </span>
        )}
      </div>

      <div
        ref={setNodeRef}
        role="region"
        aria-label={`${label ?? stage} column`}
        className={cn(
          "flex flex-col gap-2.5 rounded-xl p-2.5 border-t-4 min-h-32 flex-1 transition-colors",
          stageColors[stage],
          terminal ? "bg-muted/20" : "bg-muted/30",
          isOver && "ring-2 ring-[var(--orange)]/50 bg-[var(--orange-muted)]/30 dark:bg-[var(--orange)]/5"
        )}
      >
        {opportunities.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            isUpdating={pendingIds?.has(opp.id)}
          />
        ))}

        {opportunities.length === 0 && (
          <div
            className={cn(
              "flex items-center justify-center min-h-20 text-xs text-muted-foreground border-2 border-dashed rounded-lg",
              isOver ? "border-[var(--orange)] text-[var(--orange)]" : "border-border"
            )}
          >
            Drop here
          </div>
        )}

        {!terminal && opportunities.length > 0 && (
          <button
            type="button"
            className="text-xs text-muted-foreground flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-border hover:border-[var(--orange)] hover:text-[var(--orange)] transition-colors"
          >
            <Plus className="size-3" />
            Add
          </button>
        )}
      </div>
    </div>
  )
}

/** Combined Won / Lost column with two drop zones */
export function TerminalKanbanColumn({
  wonOpps,
  lostOpps,
  pendingIds,
}: {
  wonOpps: Opportunity[]
  lostOpps: Opportunity[]
  pendingIds?: Set<string>
}) {
  const totalValue = [...wonOpps, ...lostOpps].reduce((s, o) => s + o.value, 0)

  return (
    <div className="flex flex-col gap-2 shrink-0 min-w-64 w-64">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Won / Lost</span>
          <Badge variant="secondary" className="px-1.5 py-0 text-xs">
            {wonOpps.length + lostOpps.length}
          </Badge>
        </div>
        {totalValue > 0 && (
          <span className="text-xs text-muted-foreground font-medium tabular-nums">
            {formatOppValue(totalValue)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl p-2.5 bg-muted/20 border border-border/60 flex-1">
        <KanbanColumn stage="Won" label="Won" opportunities={wonOpps} compact pendingIds={pendingIds} />
        <KanbanColumn stage="Lost" label="Lost" opportunities={lostOpps} compact pendingIds={pendingIds} />
      </div>
    </div>
  )
}
