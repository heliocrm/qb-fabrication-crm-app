"use client"

import { useEffect, useState } from "react"
import { Loader2, UserPlus } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  listOrgUsersForPickerAction,
  setJobAssigneesAction,
} from "@/lib/actions/jobs"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { ProfileSummary } from "@/types"

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  member: "Member",
  viewer: "Viewer",
}

interface ShopTeamCardProps {
  jobId: string
  assignedUsers: ProfileSummary[]
  canManage: boolean
  onAssignedUsersChange?: (users: ProfileSummary[]) => void
}

export function ShopTeamCard({
  jobId,
  assignedUsers,
  canManage,
  onAssignedUsersChange,
}: ShopTeamCardProps) {
  const [users, setUsers] = useState(assignedUsers)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [orgUsers, setOrgUsers] = useState<ProfileSummary[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(assignedUsers.map((u) => u.id))
  )
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setUsers(assignedUsers)
    setSelectedIds(new Set(assignedUsers.map((u) => u.id)))
  }, [assignedUsers])

  async function openPicker() {
    setPickerOpen(true)
    if (orgUsers.length > 0) return
    setLoading(true)
    const result = await listOrgUsersForPickerAction()
    setLoading(false)
    if (result.error) {
      toast.error("Could not load team", result.error)
      return
    }
    setOrgUsers(result.data ?? [])
  }

  function toggleUser(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function saveAssignees() {
    setSaving(true)
    const result = await setJobAssigneesAction(jobId, [...selectedIds])
    setSaving(false)

    if (result.error) {
      toast.error("Could not update team", result.error)
      return
    }

    const updated = result.data ?? []
    setUsers(updated)
    onAssignedUsersChange?.(updated)
    setPickerOpen(false)
    toast.success("Shop team updated")
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-semibold">Shop Team</CardTitle>
        {canManage && (
          <Button type="button" variant="outline" size="sm" onClick={openPicker}>
            <UserPlus className="size-3.5" />
            Manage
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No one assigned yet.</p>
        ) : (
          users.map((user) => (
            <div key={user.id} className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback className="text-xs font-bold bg-[var(--orange)] text-white">
                  {user.avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {ROLE_LABELS[user.role] ?? user.role}
                </p>
              </div>
            </div>
          ))
        )}

        {pickerOpen && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Select team members
            </p>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading team…
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {orgUsers.map((user) => (
                  <label
                    key={user.id}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted/50 text-sm",
                      selectedIds.has(user.id) && "bg-muted/40"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={() => toggleUser(user.id)}
                      className="rounded border-input"
                    />
                    <span>{user.fullName}</span>
                    <span className="text-xs text-muted-foreground ml-auto capitalize">
                      {user.role}
                    </span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saving}
                className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
                onClick={saveAssignees}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
