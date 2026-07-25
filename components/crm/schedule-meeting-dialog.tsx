"use client"

import { useEffect, useState } from "react"
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
import { scheduleCrmMeetingAction } from "@/lib/actions/google-crm"
import { toast } from "@/lib/toast"

interface ScheduleMeetingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  titleDefault?: string
  attendeeEmail?: string | null
  accountId?: string | null
  contactId?: string | null
  jobId?: string | null
  onScheduled?: () => void
}

function defaultStartLocal(): string {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)
  return toLocalInput(d)
}

function defaultEndLocal(startLocal: string): string {
  const d = new Date(startLocal)
  d.setHours(d.getHours() + 1)
  return toLocalInput(d)
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ScheduleMeetingDialog({
  open,
  onOpenChange,
  titleDefault = "Customer meeting",
  attendeeEmail,
  accountId,
  contactId,
  jobId,
  onScheduled,
}: ScheduleMeetingDialogProps) {
  const [title, setTitle] = useState(titleDefault)
  const [startLocal, setStartLocal] = useState(defaultStartLocal)
  const [endLocal, setEndLocal] = useState(() =>
    defaultEndLocal(defaultStartLocal())
  )
  const [attendees, setAttendees] = useState(attendeeEmail ?? "")
  const [notes, setNotes] = useState("")
  const [createMeet, setCreateMeet] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(titleDefault)
    const start = defaultStartLocal()
    setStartLocal(start)
    setEndLocal(defaultEndLocal(start))
    setAttendees(attendeeEmail ?? "")
    setNotes("")
    setCreateMeet(true)
  }, [open, titleDefault, attendeeEmail])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Title required", "Enter a meeting title.")
      return
    }
    setSaving(true)
    const result = await scheduleCrmMeetingAction({
      title: title.trim(),
      startIso: new Date(startLocal).toISOString(),
      endIso: new Date(endLocal).toISOString(),
      attendeeEmails: attendees
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean),
      notes: notes.trim() || undefined,
      createMeetLink: createMeet,
      accountId,
      contactId,
      jobId,
    })
    setSaving(false)
    if (result.error) {
      toast.error("Could not schedule", result.error)
      return
    }
    toast.success("Meeting scheduled", "Logged to CRM activity.")
    onOpenChange(false)
    onScheduled?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Schedule meeting</DialogTitle>
            <DialogDescription>
              Creates a Google Calendar event and logs it as a CRM meeting.
              Connect Google in Settings first.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Start</label>
                <Input
                  type="datetime-local"
                  value={startLocal}
                  onChange={(e) => {
                    setStartLocal(e.target.value)
                    setEndLocal(defaultEndLocal(e.target.value))
                  }}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">End</label>
                <Input
                  type="datetime-local"
                  value={endLocal}
                  onChange={(e) => setEndLocal(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Attendees</label>
              <Input
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs resize-y"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={createMeet}
                onChange={(e) => setCreateMeet(e.target.checked)}
                className="size-4 rounded border"
              />
              Add Google Meet link
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Schedule"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
