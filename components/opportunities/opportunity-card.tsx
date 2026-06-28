"use client"

import { memo } from "react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Calendar, GripVertical } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatCloseDate, formatOppValue } from "@/lib/opportunities-config"
import type { Opportunity } from "@/types"

const BPA_CUSTOMER_ID = "c1"

interface OpportunityCardProps {
  opportunity: Opportunity
  isDragOverlay?: boolean
  isUpdating?: boolean
}

export const OpportunityCard = memo(function OpportunityCard({
  opportunity,
  isDragOverlay,
  isUpdating,
}: OpportunityCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opportunity.id,
    data: { opportunity, stage: opportunity.stage },
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  const isBpa = opportunity.customerId === BPA_CUSTOMER_ID

  return (
    <Card
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      className={cn(
        "border shadow-sm transition-shadow touch-none",
        isDragOverlay && "shadow-lg ring-2 ring-[var(--orange)]/30 rotate-1",
        isDragging && !isDragOverlay && "opacity-40 shadow-none",
        isUpdating && "opacity-70 pointer-events-none"
      )}
    >
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-start gap-1.5">
          <button
            type="button"
            className="mt-0.5 shrink-0 cursor-grab text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing touch-none"
            {...listeners}
            {...attributes}
            aria-label="Drag opportunity"
          >
            <GripVertical className="size-3.5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">
              {opportunity.title}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 pl-5">
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground truncate flex-1">
              {opportunity.customer}
            </p>
            {isBpa && (
              <Badge className="text-[8px] px-1 py-0 bg-[var(--navy)] text-white border-0 shrink-0">
                BPA
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-foreground tabular-nums">
              {formatOppValue(opportunity.value)}
            </span>
            <span
              className={cn(
                "text-xs font-semibold tabular-nums",
                opportunity.probability >= 75
                  ? "text-green-600 dark:text-green-400"
                  : opportunity.probability >= 40
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
              )}
            >
              {opportunity.probability}%
            </span>
          </div>

          <Progress value={opportunity.probability} className="h-1" />

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="size-3 shrink-0" />
            <span>Close {formatCloseDate(opportunity.closeDate)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
