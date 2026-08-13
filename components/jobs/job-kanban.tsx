"use client"

import { useCallback, useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { JobCard } from "@/components/job-card"
import { JOB_STATUSES, statusColors } from "@/lib/jobs-config"
import { formatCurrency, cn } from "@/lib/utils"
import type { Job, JobStatus } from "@/types"

interface JobKanbanProps {
  jobs: Job[]
  onStatusChange?: (id: string, status: JobStatus) => void
  pendingIds?: Set<string>
  canViewFinancials?: boolean
}

function JobKanbanColumn({
  status,
  jobs,
  pendingIds,
  canViewFinancials = false,
}: {
  status: JobStatus
  jobs: Job[]
  pendingIds?: Set<string>
  canViewFinancials?: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const colValue = jobs.reduce((sum, j) => sum + j.value, 0)

  return (
    <div className="flex flex-col gap-2 min-w-[15rem] w-[15rem] sm:min-w-0 sm:w-auto sm:flex-1 shrink-0 snap-start">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{status}</span>
          <Badge variant="secondary" className="px-1.5 py-0 text-xs">
            {jobs.length}
          </Badge>
        </div>
        {canViewFinancials && colValue > 0 && (
          <span className="text-xs text-muted-foreground font-medium tabular-nums">
            {formatCurrency(colValue)}
          </span>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          `flex flex-col gap-2.5 rounded-xl p-2.5 border-t-4 min-h-32 max-h-[70vh] overflow-y-auto bg-muted/30 transition-colors ${statusColors[status]}`,
          isOver && "ring-2 ring-[var(--orange)]/50 bg-[var(--orange-muted)]/30"
        )}
      >
        {jobs.map((job) => (
          <DraggableJobCard
            key={job.id}
            job={job}
            isUpdating={pendingIds?.has(job.id)}
          />
        ))}
        {jobs.length === 0 && (
          <div
            className={cn(
              "flex items-center justify-center min-h-20 text-xs text-muted-foreground border-2 border-dashed rounded-lg",
              isOver ? "border-[var(--orange)] text-[var(--orange)]" : "border-border"
            )}
          >
            {onStatusHint()}
          </div>
        )}
      </div>
    </div>
  )
}

function onStatusHint() {
  return "Drop here"
}

function DraggableJobCard({
  job,
  isUpdating,
  isDragOverlay,
}: {
  job: Job
  isUpdating?: boolean
  isDragOverlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
    data: { job, status: job.status },
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      className={cn(
        "relative touch-none",
        isDragging && !isDragOverlay && "opacity-40",
        isUpdating && "opacity-70 pointer-events-none",
        isDragOverlay && "rotate-1"
      )}
    >
      <button
        type="button"
        className="absolute left-1.5 top-3 z-10 cursor-grab text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing touch-none"
        {...listeners}
        {...attributes}
        aria-label={`Drag ${job.jobNumber}`}
      >
        <GripVertical className="size-3.5" />
      </button>
      <div className="pl-5">
        {isDragOverlay ? (
          <JobCard job={job} showStatus={false} disableLink />
        ) : (
          <JobCard job={job} showStatus={false} />
        )}
      </div>
    </div>
  )
}

export function JobKanban({
  jobs,
  onStatusChange,
  pendingIds,
  canViewFinancials = false,
}: JobKanbanProps) {
  const [activeJob, setActiveJob] = useState<Job | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const job = event.active.data.current?.job as Job | undefined
    if (job) setActiveJob(job)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveJob(null)
      const { active, over } = event
      if (!over || !onStatusChange) return

      const jobId = String(active.id)
      const newStatus = over.id as JobStatus
      const current = jobs.find((j) => j.id === jobId)
      if (!current || current.status === newStatus) return
      if (!JOB_STATUSES.includes(newStatus)) return

      onStatusChange(jobId, newStatus)
    },
    [jobs, onStatusChange]
  )

  const handleDragCancel = useCallback(() => {
    setActiveJob(null)
  }, [])

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory scroll-smooth sm:overflow-x-visible">
        {JOB_STATUSES.map((status) => (
          <JobKanbanColumn
            key={status}
            status={status}
            jobs={jobs.filter((j) => j.status === status)}
            pendingIds={pendingIds}
            canViewFinancials={canViewFinancials}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {activeJob ? (
          <DraggableJobCard job={activeJob} isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
