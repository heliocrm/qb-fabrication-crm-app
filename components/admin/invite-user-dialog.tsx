"use client"

import { useState } from "react"
import { Loader2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { sendInviteAction } from "@/lib/actions/admin"
import { toast } from "@/lib/toast"
import type { OrganizationRole, OrgUser } from "@/types"

const ROLES: { value: OrganizationRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
]

interface InviteUserDialogProps {
  onInvited: (user: OrgUser) => void
}

export function InviteUserDialog({ onInvited }: InviteUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get("email") ?? "").trim()
    const fullName = String(fd.get("fullName") ?? "").trim()
    const role = String(fd.get("role") ?? "member") as OrganizationRole

    if (!email || !fullName) {
      toast.error("Missing fields", "Email and full name are required.")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await sendInviteAction({ email, fullName, role })

      if (result.error) {
        toast.error("Invite failed", result.error)
        return
      }

      if (result.data) {
        onInvited(result.data)
        toast.success("Invitation sent", `${fullName} will receive an email to join.`)
        setOpen(false)
        return
      }

      toast.error("Invite failed", "No response from server. Check the console and try again.")
    } catch (err) {
      console.error("[invite] sendInviteAction failed:", err)
      toast.error("Invite failed", err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white">
            <UserPlus className="size-4" />
            Invite / Add User
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>
            Send an email invitation. They will join the QB Fabrication organization with the role you choose.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="invite-email" className="text-sm font-medium">
              Email
            </label>
            <Input id="invite-email" name="email" type="email" required placeholder="name@qbfab.com" />
          </div>
          <div className="space-y-2">
            <label htmlFor="invite-name" className="text-sm font-medium">
              Full name
            </label>
            <Input id="invite-name" name="fullName" required placeholder="James Nguyen" />
          </div>
          <div className="space-y-2">
            <label htmlFor="invite-role" className="text-sm font-medium">
              Role
            </label>
            <select
              id="invite-role"
              name="role"
              defaultValue="member"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send invite"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
