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
  createContactAction,
  updateContactAction,
} from "@/lib/actions/contacts"
import { toast } from "@/lib/toast"
import type { Contact } from "@/types"

interface ContactFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  contact?: Contact | null
  onSaved?: () => void
}

export function ContactFormDialog({
  open,
  onOpenChange,
  accountId,
  contact,
  onSaved,
}: ContactFormDialogProps) {
  const isEdit = Boolean(contact)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fullName, setFullName] = useState(contact?.fullName ?? "")
  const [roleTitle, setRoleTitle] = useState(contact?.roleTitle ?? "")
  const [email, setEmail] = useState(contact?.email ?? "")
  const [phone, setPhone] = useState(contact?.phone ?? "")
  const [personalNotes, setPersonalNotes] = useState(contact?.personalNotes ?? "")
  const [nextTouchAt, setNextTouchAt] = useState(
    contact?.nextTouchAt?.slice(0, 10) ?? ""
  )
  const [isPrimary, setIsPrimary] = useState(contact?.isPrimary ?? false)

  function sync() {
    setFullName(contact?.fullName ?? "")
    setRoleTitle(contact?.roleTitle ?? "")
    setEmail(contact?.email ?? "")
    setPhone(contact?.phone ?? "")
    setPersonalNotes(contact?.personalNotes ?? "")
    setNextTouchAt(contact?.nextTouchAt?.slice(0, 10) ?? "")
    setIsPrimary(contact?.isPrimary ?? false)
  }

  useEffect(() => {
    if (open) sync()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset form when dialog opens
  }, [open, contact?.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error("Missing name", "Contact name is required.")
      return
    }

    const payload = {
      fullName: fullName.trim(),
      roleTitle: roleTitle.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      personalNotes: personalNotes.trim() || null,
      nextTouchAt: nextTouchAt || null,
      isPrimary,
    }

    setIsSubmitting(true)
    const result =
      isEdit && contact
        ? await updateContactAction(contact.id, payload)
        : await createContactAction({ accountId, ...payload })
    setIsSubmitting(false)

    if (result.error) {
      toast.error(isEdit ? "Could not update contact" : "Could not add contact", result.error)
      return
    }

    toast.success(isEdit ? "Contact updated" : "Contact added")
    onOpenChange(false)
    onSaved?.()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) sync()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit contact" : "Add contact"}</DialogTitle>
          <DialogDescription>
            People and personal notes for this account
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="c-name">
              Name *
            </label>
            <Input
              id="c-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="c-role">
              Role / title
            </label>
            <Input
              id="c-role"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="PM, buyer, estimator…"
            />
          </div>
          <div className="grid gap-3 grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="c-email">
                Email
              </label>
              <Input
                id="c-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="c-phone">
                Phone
              </label>
              <Input
                id="c-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="c-next">
              Next touch
            </label>
            <Input
              id="c-next"
              type="date"
              value={nextTouchAt}
              onChange={(e) => setNextTouchAt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="c-notes">
              Personal notes
            </label>
            <textarea
              id="c-notes"
              rows={3}
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs resize-y min-h-[80px]"
              placeholder="Kids, hobbies, communication style, past favors…"
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="size-4 rounded border-input"
            />
            Primary contact for this account
          </label>
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
              ) : isEdit ? (
                "Save"
              ) : (
                "Add contact"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
