"use client"

import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { ChevronDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { SortableTaskItem } from "@/components/jobs/detail/sortable-task-item"
import {
  LINE_ITEM_WIP_STATUSES,
  TASK_CATEGORIES,
  taskCategoryStyles,
  wipStatusStyles,
} from "@/lib/job-detail-config"
import {
  createLineItemAction,
  toggleTaskAction,
  updateLineItemWipAction,
} from "@/lib/actions/jobs"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { JobTemplateType, LineItem, LineItemWipStatus, Task, TaskCategory } from "@/types"

interface JobLineItemsTabProps {
  lineItems: LineItem[]
  onLineItemsChange: (lineItems: LineItem[]) => void
  jobId?: string
  jobTemplate?: JobTemplateType | null
}

export function JobLineItemsTab({
  lineItems,
  onLineItemsChange,
  jobId,
  jobTemplate,
}: JobLineItemsTabProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(lineItems.map((li) => [li.id, true]))
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const allTasks = lineItems.flatMap((li) => li.tasks)
  const completedTasks = allTasks.filter((t) => t.completed).length
  const totalTasks = allTasks.length
  const progressPct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0
  const doneLineItems = lineItems.filter((li) => li.wipStatus === "Done").length

  function updateLineItemTasks(lineItemId: string, tasks: Task[]) {
    onLineItemsChange(
      lineItems.map((li) => (li.id === lineItemId ? { ...li, tasks } : li))
    )
  }

  function toggleTask(lineItemId: string, taskId: string) {
    const lineItem = lineItems.find((li) => li.id === lineItemId)
    const task = lineItem?.tasks.find((t) => t.id === taskId)
    if (!lineItem || !task) return

    const completed = !task.completed
    const previous = lineItems
    updateLineItemTasks(
      lineItemId,
      lineItem.tasks.map((t) => (t.id === taskId ? { ...t, completed } : t))
    )

    if (jobId) {
      void toggleTaskAction(taskId, completed, jobId).then((result) => {
        if (result.error) {
          onLineItemsChange(previous)
          toast.error("Could not update task", result.error)
        }
      })
    }
  }

  function handleWipChange(lineItemId: string, wipStatus: LineItemWipStatus) {
    const previous = lineItems
    onLineItemsChange(
      lineItems.map((li) => (li.id === lineItemId ? { ...li, wipStatus } : li))
    )

    if (jobId) {
      void updateLineItemWipAction(lineItemId, wipStatus, jobId).then((result) => {
        if (result.error) {
          onLineItemsChange(previous)
          toast.error("Could not update line item status", result.error)
        }
      })
    }
  }

  function handleDragEnd(
    event: DragEndEvent,
    lineItemId: string,
    category: TaskCategory
  ) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const lineItem = lineItems.find((li) => li.id === lineItemId)
    if (!lineItem) return

    const catTasks = lineItem.tasks.filter((t) => t.category === category)
    const otherTasks = lineItem.tasks.filter((t) => t.category !== category)
    const oldIndex = catTasks.findIndex((t) => t.id === active.id)
    const newIndex = catTasks.findIndex((t) => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    updateLineItemTasks(lineItemId, [
      ...otherTasks,
      ...arrayMove(catTasks, oldIndex, newIndex),
    ])
  }

  async function handleAddLineItem() {
    if (!jobId || !jobTemplate) {
      toast.error("Cannot add line item", "This job has no template type set.")
      return
    }

    const title = window.prompt("Line item title (e.g. 2 ea MK-115DC Crossarm)")
    if (!title?.trim()) return

    const result = await createLineItemAction(jobId, jobTemplate, { title: title.trim() })
    if (result.error) {
      toast.error("Could not add line item", result.error)
      return
    }
    if (result.data) {
      onLineItemsChange([...lineItems, result.data])
      setExpanded((prev) => ({ ...prev, [result.data!.id]: true }))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-muted/20">
        <div className="space-y-1 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {lineItems.length} line item{lineItems.length !== 1 ? "s" : ""} · {doneLineItems} in Done
          </p>
          <Progress value={progressPct} className="h-2 max-w-xs" />
          <p className="text-xs text-muted-foreground">
            {completedTasks} of {totalTasks} checklist items complete across all line items
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 shrink-0"
          onClick={() => void handleAddLineItem()}
          disabled={!jobId || !jobTemplate}
        >
          <Plus className="size-4" data-icon="inline-start" />
          Add Line Item
        </Button>
      </div>

      {lineItems.map((lineItem) => {
        const liDone = lineItem.tasks.filter((t) => t.completed).length
        const liTotal = lineItem.tasks.length
        const liPct = liTotal ? Math.round((liDone / liTotal) * 100) : 0
        const isOpen = expanded[lineItem.id] ?? true

        return (
          <Card key={lineItem.id} className="border shadow-sm overflow-hidden">
            <CardHeader className="py-3 px-4 border-b bg-muted/30">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  type="button"
                  className="flex items-start gap-2 text-left flex-1 min-w-0"
                  onClick={() =>
                    setExpanded((prev) => ({ ...prev, [lineItem.id]: !isOpen }))
                  }
                >
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 mt-0.5 text-muted-foreground transition-transform",
                      !isOpen && "-rotate-90"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{lineItem.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lineItem.quantity} ea
                      {lineItem.lineItemNumber && (
                        <span className="font-mono ml-2">CID {lineItem.lineItemNumber}</span>
                      )}
                      <span className="ml-2 tabular-nums">
                        · {liDone}/{liTotal} tasks
                      </span>
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <Progress value={liPct} className="h-1.5 w-16 hidden sm:block" />
                  <select
                    value={lineItem.wipStatus}
                    onChange={(e) =>
                      handleWipChange(lineItem.id, e.target.value as LineItemWipStatus)
                    }
                    className={cn(
                      "text-xs font-medium rounded-md border px-2 py-1",
                      wipStatusStyles[lineItem.wipStatus]
                    )}
                  >
                    {LINE_ITEM_WIP_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>

            {isOpen && (
              <CardContent className="p-0 divide-y">
                {TASK_CATEGORIES.map((category) => {
                  const catTasks = lineItem.tasks.filter((t) => t.category === category)
                  const done = catTasks.filter((t) => t.completed).length
                  const showEmpty = Boolean(jobTemplate) && catTasks.length === 0

                  if (!catTasks.length && !showEmpty) return null

                  return (
                    <div key={category}>
                      <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 border-b">
                        <Badge className={cn("text-xs border", taskCategoryStyles[category])}>
                          {category}
                        </Badge>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {done}/{catTasks.length}
                        </span>
                      </div>
                      {catTasks.length > 0 ? (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(e) => handleDragEnd(e, lineItem.id, category)}
                        >
                          <SortableContext
                            items={catTasks.map((t) => t.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {catTasks.map((task) => (
                              <SortableTaskItem
                                key={task.id}
                                task={task}
                                onToggle={(id) => toggleTask(lineItem.id, id)}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                      ) : (
                        <p className="px-4 py-3 text-xs text-muted-foreground italic">
                          No tasks in this category
                        </p>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            )}
          </Card>
        )
      })}

      {lineItems.length === 0 && (
        <Card className="border shadow-sm">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No line items yet. Create a job from a template to seed production checklists.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
