"use client"

import { useEffect, useState } from "react"
import { Loader2, Pencil } from "lucide-react"
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
import { deactivateOrgUserAction, updateOrgUserAction } from "@/lib/actions/admin"
import {
  clearFloorPinAction,
  setFloorPinAction,
} from "@/lib/actions/floor-signoff"
import { toast } from "@/lib/toast"
import type { MaterialPullCapabilities, OrganizationRole, OrgUser } from "@/types"

const ROLES: { value: OrganizationRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
]

const CAP_LABELS: { key: keyof MaterialPullCapabilities; label: string }[] = [
  { key: "can_request", label: "Can request (submit)" },
  { key: "can_approve", label: "Can approve" },
  { key: "can_batch", label: "Can batch / pull (handler)" },
  { key: "can_approve_allocation", label: "Can approve borrow / allocation (PM)" },
]

interface EditUserDialogProps {
  user: OrgUser
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (user: OrgUser) => void
  onDeactivated: (profileId: string) => void
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onUpdated,
  onDeactivated,
}: EditUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [role, setRole] = useState<OrganizationRole>(user.role)
  const [isActive, setIsActive] = useState(user.isActive)
  const [fullName, setFullName] = useState(user.fullName)
  const [caps, setCaps] = useState<MaterialPullCapabilities>(
    user.materialPullCapabilities
  )
  const [isStationAccount, setIsStationAccount] = useState(user.isStationAccount)
  const [hasFloorPin, setHasFloorPin] = useState(user.hasFloorPin)
  const [newPin, setNewPin] = useState("")

  useEffect(() => {
    if (!open) return
    setRole(user.role)
    setIsActive(user.isActive)
    setFullName(user.fullName)
    setCaps(user.materialPullCapabilities)
    setIsStationAccount(user.isStationAccount)
    setHasFloorPin(user.hasFloorPin)
    setNewPin("")
  }, [open, user])

  async function handleSave() {
    setIsSubmitting(true)
    const result = await updateOrgUserAction(user.id, {
      role,
      isActive,
      fullName,
      materialPullCapabilities: caps,
      isStationAccount,
    })
    setIsSubmitting(false)

    if (result.error) {
      toast.error("Update failed", result.error)
      return
    }

    if (result.data) {
      onUpdated({ ...result.data, hasFloorPin })
      toast.success("User updated")
      onOpenChange(false)
    }
  }

  async function handleSetPin() {
    setIsSubmitting(true)
    const result = await setFloorPinAction(user.id, newPin)
    setIsSubmitting(false)
    if (result.error) {
      toast.error("PIN update failed", result.error)
      return
    }
    setHasFloorPin(true)
    setNewPin("")
    onUpdated({ ...user, hasFloorPin: true, isStationAccount })
    toast.success("Floor PIN set")
  }

  async function handleClearPin() {
    setIsSubmitting(true)
    const result = await clearFloorPinAction(user.id)
    setIsSubmitting(false)
    if (result.error) {
      toast.error("Clear PIN failed", result.error)
      return
    }
    setHasFloorPin(false)
    onUpdated({ ...user, hasFloorPin: false, isStationAccount })
    toast.success("Floor PIN cleared")
  }

  async function handleDeactivate() {
    if (!confirm(`Deactivate ${user.fullName}? They will lose access immediately.`)) return

    setIsSubmitting(true)
    const result = await deactivateOrgUserAction(user.id)
    setIsSubmitting(false)

    if (result.error) {
      toast.error("Deactivation failed", result.error)
      return
    }

    onDeactivated(user.id)
    toast.success("User deactivated")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-4" />
            Edit user
          </DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-name" className="text-sm font-medium">
              Full name
            </label>
            <Input
              id="edit-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="edit-role" className="text-sm font-medium">
              Role
            </label>
            <select
              id="edit-role"
              value={role}
              onChange={(e) => setRole(e.target.value as OrganizationRole)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-input"
            />
            Active account
          </label>

          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-sm font-medium">Material Pull capabilities</p>
            <p className="text-xs text-muted-foreground">
              Admin role always has full access. Use these overlays for manager/member seats.
            </p>
            <div className="space-y-2">
              {CAP_LABELS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={caps[key]}
                    onChange={(e) =>
                      setCaps((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="rounded border-input"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium">Floor sign-off</p>
            <p className="text-xs text-muted-foreground">
              Station tablets stay signed in as a kiosk account; workers pick
              themselves and enter a 4–8 digit PIN to sign off.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isStationAccount}
                onChange={(e) => setIsStationAccount(e.target.checked)}
                className="rounded border-input"
              />
              Station / tablet account (cannot be the signing worker)
            </label>
            <p className="text-xs text-muted-foreground">
              PIN status:{" "}
              <span className="font-medium text-foreground">
                {hasFloorPin ? "Set" : "Not set"}
              </span>
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="New PIN (4–8 digits)"
                value={newPin}
                onChange={(e) =>
                  setNewPin(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || newPin.length < 4}
                onClick={handleSetPin}
              >
                Set PIN
              </Button>
              {hasFloorPin ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSubmitting}
                  onClick={handleClearPin}
                >
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeactivate}
            disabled={isSubmitting || !user.isActive}
            className="sm:mr-auto"
          >
            Deactivate
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
