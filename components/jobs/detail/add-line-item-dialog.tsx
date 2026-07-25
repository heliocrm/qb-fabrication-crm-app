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
import { createLineItemAction } from "@/lib/actions/jobs"
import { toast } from "@/lib/toast"
import type { JobTemplateType, LineItem } from "@/types"

interface AddLineItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  jobTemplate: JobTemplateType
  onCreated?: (lineItem: LineItem) => void
}

export function AddLineItemDialog({
  open,
  onOpenChange,
  jobId,
  jobTemplate,
  onCreated,
}: AddLineItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [lineItemNumber, setLineItemNumber] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Missing title", "Line item title is required.")
      return
    }

    setIsSubmitting(true)
    const result = await createLineItemAction(jobId, jobTemplate, {
      title: title.trim(),
      quantity: Number(quantity) || 1,
      lineItemNumber: lineItemNumber.trim() || undefined,
    })
    setIsSubmitting(false)

    if (result.error) {
      toast.error("Could not add line item", result.error)
      return
    }

    toast.success("Line item added", "Template checklist has been seeded.")
    setTitle("")
    setQuantity("1")
    setLineItemNumber("")
    onOpenChange(false)
    if (result.data) onCreated?.(result.data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add line item</DialogTitle>
          <DialogDescription>
            Creates a production line item with the job template checklist
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="li-title">
              Title
            </label>
            <Input
              id="li-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2 ea MK-115DC Crossarm"
              required
            />
          </div>
          <div className="grid gap-3 grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="li-qty">
                Quantity
              </label>
              <Input
                id="li-qty"
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="li-cid">
                CID / mark
              </label>
              <Input
                id="li-cid"
                value={lineItemNumber}
                onChange={(e) => setLineItemNumber(e.target.value)}
                placeholder="Optional"
              />
            </div>
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
                  Adding…
                </>
              ) : (
                "Add line item"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
