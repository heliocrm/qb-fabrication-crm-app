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
import { sendCrmEmailAction } from "@/lib/actions/google-crm"
import { toast } from "@/lib/toast"

interface ComposeEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  toEmail?: string | null
  accountId?: string | null
  contactId?: string | null
  jobId?: string | null
  /** Prefill for reply */
  subjectDefault?: string
  threadId?: string | null
  replyToMessageId?: string | null
  onSent?: () => void
}

export function ComposeEmailDialog({
  open,
  onOpenChange,
  toEmail,
  accountId,
  contactId,
  jobId,
  subjectDefault = "",
  threadId,
  replyToMessageId,
  onSent,
}: ComposeEmailDialogProps) {
  const [to, setTo] = useState(toEmail ?? "")
  const [subject, setSubject] = useState(subjectDefault)
  const [body, setBody] = useState("")
  const [saving, setSaving] = useState(false)
  const isReply = Boolean(threadId || replyToMessageId)

  useEffect(() => {
    if (!open) return
    setTo(toEmail ?? "")
    setSubject(
      isReply && subjectDefault && !subjectDefault.startsWith("Re:")
        ? `Re: ${subjectDefault}`
        : subjectDefault
    )
    setBody("")
  }, [open, toEmail, subjectDefault, isReply])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const result = await sendCrmEmailAction({
      to: to.trim(),
      subject: subject.trim(),
      bodyText: body.trim(),
      accountId,
      contactId,
      jobId,
      threadId,
      replyToMessageId,
    })
    setSaving(false)
    if (result.error) {
      toast.error("Could not send email", result.error)
      return
    }
    toast.success("Email sent", "Logged to CRM activity.")
    onOpenChange(false)
    onSent?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isReply ? "Reply" : "Compose email"}</DialogTitle>
            <DialogDescription>
              Sends from your connected Google account and logs to this
              customer&apos;s activity. Connect Google with send access in
              Settings if send fails.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">To</label>
              <Input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                required
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs resize-y min-h-[140px]"
              />
            </div>
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
                "Send"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
