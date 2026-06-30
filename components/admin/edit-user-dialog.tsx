"use client"

import { useState } from "react"
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
import { toast } from "@/lib/toast"
import type { OrganizationRole, OrgUser } from "@/types"

const ROLES: { value: OrganizationRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
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

  async function handleSave() {
    setIsSubmitting(true)
    const result = await updateOrgUserAction(user.id, { role, isActive, fullName })
    setIsSubmitting(false)

    if (result.error) {
      toast.error("Update failed", result.error)
      return
    }

    if (result.data) {
      onUpdated(result.data)
      toast.success("User updated")
      onOpenChange(false)
    }
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
      <DialogContent className="sm:max-w-md">
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
