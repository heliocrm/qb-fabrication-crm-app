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
import { createChangeOrderAction } from "@/lib/actions/change-orders"
import { toast } from "@/lib/toast"
import type { ChangeOrderType } from "@/types"

const CHANGE_ORDER_TYPES: ChangeOrderType[] = ["Issue", "NCR", "Change Order"]

interface LogIssueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  onCreated?: () => void
}

export function LogIssueDialog({
  open,
  onOpenChange,
  jobId,
  onCreated,
}: LogIssueDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [type, setType] = useState<ChangeOrderType>("Issue")
  const [description, setDescription] = useState("")
  const [impact, setImpact] = useState("")
  const [value, setValue] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) {
      toast.error("Missing description", "Describe the issue or change.")
      return
    }

    setIsSubmitting(true)
    const result = await createChangeOrderAction(jobId, {
      type,
      description: description.trim(),
      impact: impact.trim() || undefined,
      value: value ? Number(value) : null,
    })
    setIsSubmitting(false)

    if (result.error) {
      toast.error("Could not log issue", result.error)
      return
    }

    toast.success("Issue logged")
    setDescription("")
    setImpact("")
    setValue("")
    setType("Issue")
    onOpenChange(false)
    onCreated?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log issue</DialogTitle>
          <DialogDescription>
            Track field issues, NCRs, and change orders against this job
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type</label>
            <Select
              value={type}
              onValueChange={(v) => {
                if (v != null) setType(v as ChangeOrderType)
              }}
            >
              <SelectTrigger className="w-full bg-background text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANGE_ORDER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="issue-desc">
              Description
            </label>
            <textarea
              id="issue-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs resize-y min-h-[80px]"
              placeholder="What happened?"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="issue-impact">
              Impact
            </label>
            <Input
              id="issue-impact"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              placeholder="Schedule, rework, material…"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="issue-value">
              Value impact ($)
            </label>
            <Input
              id="issue-value"
              type="number"
              min={0}
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Log issue"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
