"use client"

import { useRef, useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Calendar, CheckCircle2, Clock, GripVertical, User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { SignoffBadge } from "@/components/floor/floor-signoff-dialog"
import { taskCategoryStyles } from "@/lib/job-detail-config"
import { cn } from "@/lib/utils"
import type { ProfileSummary, Task, TaskSignoff } from "@/types"

export type TaskAssigneeDuePatch = {
  assignee?: string
  assigneeId?: string | null
  dueDate?: string
}

function parseDueDate(raw: string | undefined | null): Date | null {
  const s = raw?.trim()
  if (!s) return null
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T12:00:00` : s
  const d = new Date(normalized)
  return Number.isNaN(d.getTime()) ? null : d
}

function toInputDateValue(raw: string | undefined | null): string {
  const d = parseDueDate(raw)
  if (!d) return ""
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatDueLabel(raw: string | undefined | null): string | null {
  const d = parseDueDate(raw)
  if (!d) return null
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function assigneeInitials(task: Task, orgUsers: ProfileSummary[]): string {
  if (task.assigneeId) {
    const u = orgUsers.find((p) => p.id === task.assigneeId)
    if (u?.avatarInitials) return u.avatarInitials
  }
  const name = task.assignee?.trim()
  if (!name || name === "Unassigned") return ""
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

interface SortableTaskItemProps {
  task: Task
  onToggle: (id: string) => void
  signoff?: TaskSignoff | null
  canEdit?: boolean
  orgUsers?: ProfileSummary[]
  onPatch?: (taskId: string, patch: TaskAssigneeDuePatch) => void
}

export function SortableTaskItem({
  task,
  onToggle,
  signoff,
  canEdit = false,
  orgUsers = [],
  onPatch,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const [dateOpen, setDateOpen] = useState(false)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const due = parseDueDate(task.dueDate)
  const dueLabel = formatDueLabel(task.dueDate)
  const isOverdue = !task.completed && due != null && due < new Date()
  const initials = assigneeInitials(task, orgUsers)
  const hasAssignee = Boolean(
    task.assigneeId || (task.assignee?.trim() && task.assignee !== "Unassigned")
  )

  function openDatePicker() {
    if (!canEdit || !onPatch) return
    setDateOpen(true)
    requestAnimationFrame(() => dateInputRef.current?.showPicker?.())
  }

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

      <div className="flex-1 min-w-0 space-y-1">
        <p
          className={cn(
            "text-sm font-medium",
            task.completed && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
        {signoff ? <SignoffBadge signoff={signoff} /> : null}
      </div>

      <Badge
        variant="outline"
        className={cn(
          "text-[10px] shrink-0 hidden sm:inline-flex border",
          taskCategoryStyles[task.category]
        )}
      >
        {task.category}
      </Badge>

      <div className="flex items-center gap-2 shrink-0">
        {canEdit && onPatch ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring",
                "hover:opacity-90"
              )}
              aria-label="Assign task"
            >
              <Avatar className="size-6 cursor-pointer">
                <AvatarFallback className="text-[9px] font-bold bg-muted text-muted-foreground">
                  {initials || <User className="size-3" />}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44 max-h-64">
              <DropdownMenuItem
                onClick={() =>
                  onPatch(task.id, { assignee: "", assigneeId: null })
                }
              >
                Unassigned
              </DropdownMenuItem>
              {orgUsers
                .filter((u) => u.isActive)
                .map((u) => (
                  <DropdownMenuItem
                    key={u.id}
                    onClick={() =>
                      onPatch(task.id, {
                        assignee: u.fullName,
                        assigneeId: u.id,
                      })
                    }
                  >
                    <span className="truncate">{u.fullName}</span>
                    {task.assigneeId === u.id ? (
                      <span className="ml-auto text-xs text-muted-foreground">
                        Current
                      </span>
                    ) : null}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Avatar className="size-6">
            <AvatarFallback className="text-[9px] font-bold bg-muted text-muted-foreground">
              {initials || (hasAssignee ? "?" : "")}
            </AvatarFallback>
          </Avatar>
        )}

        {canEdit && onPatch ? (
          <div className="relative">
            <button
              type="button"
              onClick={openDatePicker}
              className={cn(
                "flex items-center gap-1 text-xs whitespace-nowrap rounded-md px-1.5 py-0.5 hover:bg-muted",
                isOverdue
                  ? "text-red-600 dark:text-red-400 font-medium"
                  : "text-muted-foreground"
              )}
              aria-label={dueLabel ? `Due ${dueLabel}` : "Set due date"}
            >
              <Calendar className="size-3" />
              {dueLabel ?? "Set date"}
            </button>
            {dateOpen ? (
              <Input
                ref={dateInputRef}
                type="date"
                className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                value={toInputDateValue(task.dueDate)}
                onChange={(e) => {
                  const v = e.target.value
                  onPatch(task.id, { dueDate: v })
                  setDateOpen(false)
                }}
                onBlur={() => setDateOpen(false)}
              />
            ) : null}
            {dueLabel ? (
              <button
                type="button"
                className="sr-only"
                onClick={() => onPatch(task.id, { dueDate: "" })}
              >
                Clear due date
              </button>
            ) : null}
          </div>
        ) : (
          <div
            className={cn(
              "flex items-center gap-1 text-xs whitespace-nowrap",
              isOverdue
                ? "text-red-600 dark:text-red-400 font-medium"
                : "text-muted-foreground"
            )}
          >
            <Calendar className="size-3" />
            {dueLabel ?? "—"}
          </div>
        )}

        {canEdit && onPatch && dueLabel ? (
          <button
            type="button"
            title="Clear due date"
            className="text-[10px] text-muted-foreground hover:text-foreground px-0.5"
            onClick={() => onPatch(task.id, { dueDate: "" })}
          >
            ×
          </button>
        ) : null}

        {task.completed ? (
          <CheckCircle2 className="size-4 text-green-500 shrink-0" />
        ) : (
          <Clock
            className={cn(
              "size-4 shrink-0",
              isOverdue ? "text-red-500" : "text-muted-foreground/50"
            )}
          />
        )}
      </div>
    </div>
  )
}
