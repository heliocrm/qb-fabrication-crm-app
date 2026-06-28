"use client"

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
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { SortableTaskItem } from "@/components/jobs/detail/sortable-task-item"
import { TASK_CATEGORIES, taskCategoryStyles } from "@/lib/job-detail-config"
import { toggleTaskAction } from "@/lib/actions/jobs"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Task, TaskCategory } from "@/types"

interface JobTasksTabProps {
  tasks: Task[]
  onTasksChange: (tasks: Task[]) => void
  jobId?: string
}

export function JobTasksTab({ tasks, onTasksChange, jobId }: JobTasksTabProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const completedTasks = tasks.filter((t) => t.completed).length
  const totalTasks = tasks.length
  const progressPct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0

  function toggleTask(id: string) {
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    const completed = !task.completed
    const previous = tasks
    onTasksChange(
      tasks.map((t) => (t.id === id ? { ...t, completed } : t))
    )

    if (jobId) {
      void toggleTaskAction(id, completed, jobId).then((result) => {
        if (result.error) {
          onTasksChange(previous)
          toast.error("Could not update task", result.error)
        }
      })
    }
  }

  function handleDragEnd(event: DragEndEvent, category: TaskCategory) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const catTasks = tasks.filter((t) => t.category === category)
    const otherTasks = tasks.filter((t) => t.category !== category)
    const oldIndex = catTasks.findIndex((t) => t.id === active.id)
    const newIndex = catTasks.findIndex((t) => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onTasksChange([...otherTasks, ...arrayMove(catTasks, oldIndex, newIndex)])
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-muted/20">
        <div className="space-y-1 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {completedTasks} of {totalTasks} tasks complete
          </p>
          <Progress value={progressPct} className="h-2 max-w-xs" />
          <p className="text-xs text-muted-foreground">
            Drag tasks to reorder · Check off as shop floor completes each step
          </p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
          <Plus className="size-4" data-icon="inline-start" />
          Add Task
        </Button>
      </div>

      {TASK_CATEGORIES.map((category) => {
        const catTasks = tasks.filter((t) => t.category === category)
        if (!catTasks.length) return null
        const done = catTasks.filter((t) => t.completed).length

        return (
          <Card key={category} className="border shadow-sm overflow-hidden">
            <CardHeader className="py-3 px-4 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-xs border", taskCategoryStyles[category])}>
                    {category}
                  </Badge>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {done}/{catTasks.length} done
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(e, category)}
              >
                <SortableContext
                  items={catTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {catTasks.map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        )
      })}

      {totalTasks === 0 && (
        <Card className="border shadow-sm">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No tasks yet. Add fabrication steps like Cut, Fit &amp; Weld, Galvanize, QC.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
