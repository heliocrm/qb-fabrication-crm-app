"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createTaskAction } from "@/lib/actions/jobs"
import { TASK_CATEGORIES } from "@/lib/job-detail-config"
import { toast } from "@/lib/toast"
import type { LineItem, TaskCategory } from "@/types"

interface AddTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  lineItems: LineItem[]
  onCreated?: () => void
}

export function AddTaskDialog({
  open,
  onOpenChange,
  jobId,
  lineItems,
  onCreated,
}: AddTaskDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lineItemId, setLineItemId] = useState(lineItems[0]?.id ?? "")
  const [title, setTitle] = useState("")
  const [assignee, setAssignee] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [category, setCategory] = useState<TaskCategory>("Fabrication")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!lineItemId) {
      toast.error("No line item", "Add a line item before creating tasks.")
      return
    }
    if (!title.trim()) {
      toast.error("Missing title", "Task title is required.")
      return
    }

    setIsSubmitting(true)
    const result = await createTaskAction(jobId, lineItemId, {
      title: title.trim(),
      assignee: assignee.trim() || "Unassigned",
      dueDate: dueDate || "",
      category,
    })
    setIsSubmitting(false)

    if (result.error) {
      toast.error("Could not add task", result.error)
      return
    }

    toast.success("Task added")
    setTitle("")
    setAssignee("")
    setDueDate("")
    onOpenChange(false)
    onCreated?.()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next && !lineItemId && lineItems[0]) {
          setLineItemId(lineItems[0].id)
        }
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add task</DialogTitle>
          <DialogDescription>
            Add a checklist task to a line item
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Line item</label>
            <Select
              value={lineItemId}
              onValueChange={(v) => {
                if (v != null) setLineItemId(v)
              }}
            >
              <SelectTrigger className="w-full bg-background text-foreground">
                <SelectValue placeholder="Select line item…" />
              </SelectTrigger>
              <SelectContent>
                {lineItems.map((li) => (
                  <SelectItem key={li.id} value={li.id}>
                    {li.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="task-title">
              Title
            </label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weld hook plates"
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={category}
                onValueChange={(v) => {
                  if (v != null) setCategory(v as TaskCategory)
                }}
              >
                <SelectTrigger className="w-full bg-background text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="task-due">
                Due date
              </label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="task-assignee">
              Assignee
            </label>
            <Input
              id="task-assignee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !lineItems.length}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Adding…
                </>
              ) : (
                "Add task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
