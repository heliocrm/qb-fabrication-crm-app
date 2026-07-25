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
import {
  createAccountAction,
  updateAccountAction,
} from "@/lib/actions/accounts"
import { toast } from "@/lib/toast"
import type { Account, AccountStatus } from "@/types"

interface CustomerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Account | null
  onSaved?: () => void
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSaved,
}: CustomerFormDialogProps) {
  const isEdit = Boolean(customer)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState(customer?.name ?? "")
  const [shortName, setShortName] = useState(customer?.shortName ?? "")
  const [contact, setContact] = useState(customer?.contact ?? "")
  const [email, setEmail] = useState(customer?.email ?? "")
  const [phone, setPhone] = useState(customer?.phone ?? "")
  const [city, setCity] = useState(customer?.city ?? "")
  const [state, setState] = useState(customer?.state ?? "")
  const [status, setStatus] = useState<AccountStatus>(customer?.status ?? "Active")
  const [qbCustomerUrl, setQbCustomerUrl] = useState(
    customer?.qbCustomerUrl ?? ""
  )
  const [qbCustomerId, setQbCustomerId] = useState(customer?.qbCustomerId ?? "")
  const [qbStatusNote, setQbStatusNote] = useState(customer?.qbStatusNote ?? "")

  function syncFromCustomer() {
    setName(customer?.name ?? "")
    setShortName(customer?.shortName ?? "")
    setContact(customer?.contact ?? "")
    setEmail(customer?.email ?? "")
    setPhone(customer?.phone ?? "")
    setCity(customer?.city ?? "")
    setState(customer?.state ?? "")
    setStatus(customer?.status ?? "Active")
    setQbCustomerUrl(customer?.qbCustomerUrl ?? "")
    setQbCustomerId(customer?.qbCustomerId ?? "")
    setQbStatusNote(customer?.qbStatusNote ?? "")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !shortName.trim()) {
      toast.error("Missing fields", "Name and short name are required.")
      return
    }

    const payload = {
      name: name.trim(),
      shortName: shortName.trim(),
      contact: contact.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      status,
      qbCustomerUrl: qbCustomerUrl.trim() || null,
      qbCustomerId: qbCustomerId.trim() || null,
      qbStatusNote: qbStatusNote.trim() || null,
    }

    setIsSubmitting(true)
    const result = isEdit && customer
      ? await updateAccountAction(customer.id, payload)
      : await createAccountAction(payload)
    setIsSubmitting(false)

    if (result.error) {
      toast.error(isEdit ? "Could not update customer" : "Could not create customer", result.error)
      return
    }

    toast.success(isEdit ? "Customer updated" : "Customer created")
    onOpenChange(false)
    onSaved?.()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) syncFromCustomer()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit customer" : "Add customer"}</DialogTitle>
          <DialogDescription>
            Fields used on jobs and material requests
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="cust-name">
              Name *
            </label>
            <Input
              id="cust-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="cust-short">
              Short name *
            </label>
            <Input
              id="cust-short"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              placeholder="BPA"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="cust-contact">
              Primary contact
            </label>
            <Input
              id="cust-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>
          <div className="grid gap-3 grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="cust-email">
                Email
              </label>
              <Input
                id="cust-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="cust-phone">
                Phone
              </label>
              <Input
                id="cust-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="cust-city">
                City
              </label>
              <Input
                id="cust-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="cust-state">
                State
              </label>
              <Input
                id="cust-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={status}
              onValueChange={(v) => {
                if (v != null) setStatus(v as AccountStatus)
              }}
            >
              <SelectTrigger className="w-full bg-background text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 border-t pt-3">
            <p className="text-sm font-medium">QuickBooks (link only)</p>
            <p className="text-xs text-muted-foreground">
              Paste the QBO customer URL, or a customer ID. Financial truth stays
              in QuickBooks.
            </p>
            <Input
              value={qbCustomerUrl}
              onChange={(e) => setQbCustomerUrl(e.target.value)}
              placeholder="https://app.qbo.intuit.com/app/customerdetail?nameId=…"
            />
            <div className="grid gap-2 grid-cols-2">
              <Input
                value={qbCustomerId}
                onChange={(e) => setQbCustomerId(e.target.value)}
                placeholder="QBO customer ID"
              />
              <Input
                value={qbStatusNote}
                onChange={(e) => setQbStatusNote(e.target.value)}
                placeholder="Status note (optional)"
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
                  Saving…
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Add customer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
