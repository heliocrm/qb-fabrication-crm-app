"use client"

import { useState } from "react"
import { KeyRound, Loader2, Mail } from "lucide-react"
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
  sendOrgUserPasswordResetAction,
  setOrgUserPasswordAction,
} from "@/lib/actions/admin"
import { toast } from "@/lib/toast"
import type { OrgUser } from "@/types"

interface ResetPasswordDialogProps {
  user: OrgUser
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResetPasswordDialog({
  user,
  open,
  onOpenChange,
}: ResetPasswordDialogProps) {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEmailing, setIsEmailing] = useState(false)

  function resetForm() {
    setPassword("")
    setConfirm("")
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 6) {
      toast.error("Invalid password", "Password must be at least 6 characters.")
      return
    }
    if (password !== confirm) {
      toast.error("Passwords do not match")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await setOrgUserPasswordAction(user.id, password)
      if (result.error) {
        toast.error("Password update failed", result.error)
        return
      }
      toast.success("Password updated", `${user.fullName} can sign in with the new password.`)
      resetForm()
      onOpenChange(false)
    } catch (err) {
      toast.error(
        "Password update failed",
        err instanceof Error ? err.message : "An unexpected error occurred"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSendResetEmail() {
    setIsEmailing(true)
    try {
      const result = await sendOrgUserPasswordResetAction(user.id)
      if (result.error) {
        toast.error("Reset email failed", result.error)
        return
      }
      toast.success("Reset email sent", `A password reset link was sent to ${user.email}.`)
      onOpenChange(false)
    } catch (err) {
      toast.error(
        "Reset email failed",
        err instanceof Error ? err.message : "An unexpected error occurred"
      )
    } finally {
      setIsEmailing(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4" />
            Reset password
          </DialogTitle>
          <DialogDescription>
            Set a new password for {user.fullName}
            {user.email ? ` (${user.email})` : ""}, or email them a reset link.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSetPassword} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="admin-reset-password" className="text-sm font-medium">
              New password
            </label>
            <Input
              id="admin-reset-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              placeholder="At least 6 characters"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="admin-reset-confirm" className="text-sm font-medium">
              Confirm password
            </label>
            <Input
              id="admin-reset-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleSendResetEmail}
              disabled={isSubmitting || isEmailing || !user.email}
              className="sm:mr-auto"
            >
              {isEmailing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              Email reset link
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isEmailing}
              className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Set password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
