"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Calendar, CheckCircle2, Clock, GripVertical } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { taskCategoryStyles } from "@/lib/job-detail-config"
import { cn } from "@/lib/utils"
import type { Task } from "@/types"

interface SortableTaskItemProps {
  task: Task
  onToggle: (id: string) => void
}

export function SortableTaskItem({ task, onToggle }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isOverdue =
    !task.completed && new Date(task.dueDate) < new Date()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-b last:border-0 bg-card hover:bg-muted/20 transition-colors",
        task.completed && "opacity-60",
        isDragging && "opacity-50 shadow-md z-10 relative"
      )}
    >
      <button
        type="button"
        className="shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>

      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        className="shrink-0"
      />

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium",
            task.completed && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
      </div>

      <Badge
        variant="outline"
        className={cn("text-[10px] shrink-0 hidden sm:inline-flex border", taskCategoryStyles[task.category])}
      >
        {task.category}
      </Badge>

      <div className="flex items-center gap-2 shrink-0">
        <Avatar className="size-6">
          <AvatarFallback className="text-[9px] font-bold bg-muted text-muted-foreground">
            {task.assignee.split(" ").map((n) => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            "flex items-center gap-1 text-xs whitespace-nowrap",
            isOverdue ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"
          )}
        >
          <Calendar className="size-3" />
          {new Date(task.dueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
        {task.completed ? (
          <CheckCircle2 className="size-4 text-green-500 shrink-0" />
        ) : (
          <Clock className={cn("size-4 shrink-0", isOverdue ? "text-red-500" : "text-muted-foreground/50")} />
        )}
      </div>
    </div>
  )
}
