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
import { updateJobAction } from "@/lib/actions/jobs"
import { JOB_PRIORITIES, JOB_STATUSES } from "@/lib/jobs-config"
import { toast } from "@/lib/toast"
import type { Job, JobStatus, Priority } from "@/types"

interface EditJobDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: Job
  onSaved?: () => void
}

export function EditJobDialog({
  open,
  onOpenChange,
  job,
  onSaved,
}: EditJobDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [description, setDescription] = useState(job.description)
  const [poNumber, setPoNumber] = useState(job.poNumber)
  const [status, setStatus] = useState<JobStatus>(job.status)
  const [priority, setPriority] = useState<Priority>(job.priority)
  const [startDate, setStartDate] = useState(job.startDate?.slice(0, 10) ?? "")
  const [deliveryDate, setDeliveryDate] = useState(
    job.deliveryDate?.slice(0, 10) ?? ""
  )
  const [tonnage, setTonnage] = useState(String(job.tonnage || ""))
  const [value, setValue] = useState(String(job.value || ""))
  const [notes, setNotes] = useState(job.notes ?? "")
  const [qbUrl, setQbUrl] = useState(job.qbUrl ?? "")
  const [qbExternalId, setQbExternalId] = useState(job.qbExternalId ?? "")

  function resetFromJob() {
    setDescription(job.description)
    setPoNumber(job.poNumber)
    setStatus(job.status)
    setPriority(job.priority)
    setStartDate(job.startDate?.slice(0, 10) ?? "")
    setDeliveryDate(job.deliveryDate?.slice(0, 10) ?? "")
    setTonnage(String(job.tonnage || ""))
    setValue(String(job.value || ""))
    setNotes(job.notes ?? "")
    setQbUrl(job.qbUrl ?? "")
    setQbExternalId(job.qbExternalId ?? "")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim() || !poNumber.trim()) {
      toast.error("Missing fields", "Description and PO number are required.")
      return
    }

    setIsSubmitting(true)
    const result = await updateJobAction(job.id, {
      description: description.trim(),
      po_number: poNumber.trim(),
      status,
      priority,
      start_date: startDate || null,
      delivery_date: deliveryDate || null,
      tonnage: tonnage ? Number(tonnage) : null,
      value: value ? Number(value) : 0,
      notes: notes.trim() || null,
      qb_url: qbUrl.trim() || null,
      qb_external_id: qbExternalId.trim() || null,
    })
    setIsSubmitting(false)

    if (result.error) {
      toast.error("Could not update job", result.error)
      return
    }

    toast.success("Job updated")
    onOpenChange(false)
    onSaved?.()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) resetFromJob()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit job</DialogTitle>
          <DialogDescription>
            {job.jobNumber} · update details and schedule
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="edit-description">
              Description
            </label>
            <Input
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="edit-po">
                PO number
              </label>
              <Input
                id="edit-po"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={status}
                onValueChange={(v) => {
                  if (v != null) setStatus(v as JobStatus)
                }}
              >
                <SelectTrigger className="w-full bg-background text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={priority}
                onValueChange={(v) => {
                  if (v != null) setPriority(v as Priority)
                }}
              >
                <SelectTrigger className="w-full bg-background text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="edit-value">
                Contract value ($)
              </label>
              <Input
                id="edit-value"
                type="number"
                min={0}
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="edit-start">
                Start date
              </label>
              <Input
                id="edit-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="edit-delivery">
                Delivery date
              </label>
              <Input
                id="edit-delivery"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="edit-tonnage">
                Tonnage
              </label>
              <Input
                id="edit-tonnage"
                type="number"
                min={0}
                step="any"
                value={tonnage}
                onChange={(e) => setTonnage(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="edit-notes">
              Notes
            </label>
            <textarea
              id="edit-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs resize-y min-h-[80px]"
            />
          </div>
          <div className="space-y-1.5 border-t pt-3">
            <label className="text-sm font-medium" htmlFor="edit-qb-url">
              QuickBooks link
            </label>
            <Input
              id="edit-qb-url"
              value={qbUrl}
              onChange={(e) => setQbUrl(e.target.value)}
              placeholder="https://app.qbo.intuit.com/app/…"
            />
            <Input
              value={qbExternalId}
              onChange={(e) => setQbExternalId(e.target.value)}
              placeholder="QB id (optional)"
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
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
