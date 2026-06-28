"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { KanbanColumn, TerminalKanbanColumn } from "@/components/opportunities/kanban-column"
import { OpportunityCard } from "@/components/opportunities/opportunity-card"
import { ACTIVE_STAGES } from "@/lib/opportunities-config"
import type { Opportunity, OppStage } from "@/types"

interface OpportunityKanbanProps {
  opportunities: Opportunity[]
  onStageChange: (id: string, stage: OppStage) => void
  pendingIds?: Set<string>
}

export function OpportunityKanban({
  opportunities,
  onStageChange,
  pendingIds,
}: OpportunityKanbanProps) {
  const [activeOpp, setActiveOpp] = useState<Opportunity | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const opp = event.active.data.current?.opportunity as Opportunity | undefined
    if (opp) setActiveOpp(opp)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveOpp(null)
    const { active, over } = event
    if (!over) return

    const oppId = String(active.id)
    const newStage = over.id as OppStage
    const current = opportunities.find((o) => o.id === oppId)
    if (!current || current.stage === newStage) return

    onStageChange(oppId, newStage)
  }, [opportunities, onStageChange])

  const handleDragCancel = useCallback(() => {
    setActiveOpp(null)
  }, [])

  const wonOpps = opportunities.filter((o) => o.stage === "Won")
  const lostOpps = opportunities.filter((o) => o.stage === "Lost")

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory scroll-smooth">
        {ACTIVE_STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            opportunities={opportunities.filter((o) => o.stage === stage)}
            pendingIds={pendingIds}
          />
        ))}
        <TerminalKanbanColumn
          wonOpps={wonOpps}
          lostOpps={lostOpps}
          pendingIds={pendingIds}
        />
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {activeOpp ? (
          <OpportunityCard opportunity={activeOpp} isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
