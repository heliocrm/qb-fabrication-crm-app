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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createCrmTaskAction,
  listFollowUpOwnerOptionsAction,
} from "@/lib/actions/crm-tasks"
import { toast } from "@/lib/toast"
import type { Contact, ProfileSummary } from "@/types"

interface FollowUpFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  contacts?: Contact[]
  /** Prefill when opened from Needs-a-touch or a contact row */
  defaultContactId?: string | null
  defaultOwnerId?: string | null
  defaultTitle?: string
  currentProfileId?: string | null
  onSaved?: () => void
}

export function FollowUpFormDialog({
  open,
  onOpenChange,
  accountId,
  contacts = [],
  defaultContactId,
  defaultOwnerId,
  defaultTitle = "",
  currentProfileId,
  onSaved,
}: FollowUpFormDialogProps) {
  const [title, setTitle] = useState(defaultTitle)
  const [body, setBody] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [contactId, setContactId] = useState<string>("")
  const [ownerId, setOwnerId] = useState<string>("")
  const [owners, setOwners] = useState<ProfileSummary[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(defaultTitle)
    setBody("")
    setDueDate("")
    setContactId(defaultContactId ?? "")
    setOwnerId(defaultOwnerId || currentProfileId || "")
    void listFollowUpOwnerOptionsAction().then((res) => {
      if (res.data) setOwners(res.data)
    })
  }, [open, defaultTitle, defaultContactId, defaultOwnerId, currentProfileId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Title required", "Enter a follow-up title.")
      return
    }
    setSaving(true)
    const result = await createCrmTaskAction({
      title: title.trim(),
      body: body.trim() || null,
      dueAt: dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : null,
      ownerId: ownerId || currentProfileId || null,
      accountId,
      contactId: contactId || defaultContactId || null,
    })
    setSaving(false)
    if (result.error) {
      toast.error("Could not create follow-up", result.error)
      return
    }
    toast.success("Follow-up created")
    onOpenChange(false)
    onSaved?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add follow-up</DialogTitle>
            <DialogDescription>
              Sales/relationship follow-up — not a shop checklist task.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Call about delivery, send quote…"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs resize-y"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Due</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Owner</label>
                <Select
                  value={ownerId || undefined}
                  onValueChange={(v) => {
                    if (v != null) setOwnerId(v)
                  }}
                >
                  <SelectTrigger className="w-full bg-background text-foreground">
                    <SelectValue placeholder="Owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {contacts.length > 0 ? (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Contact</label>
                <Select
                  value={contactId || "__none__"}
                  onValueChange={(v) => {
                    if (v == null || v === "__none__") setContactId("")
                    else setContactId(v)
                  }}
                >
                  <SelectTrigger className="w-full bg-background text-foreground">
                    <SelectValue placeholder="Optional contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Account only</SelectItem>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
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
                "Add follow-up"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
