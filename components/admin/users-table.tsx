"use client"

import { useState } from "react"
import { MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EditUserDialog } from "@/components/admin/edit-user-dialog"
import { InviteUserDialog } from "@/components/admin/invite-user-dialog"
import { ResetPasswordDialog } from "@/components/admin/reset-password-dialog"
import { cn } from "@/lib/utils"
import type { OrgUser } from "@/types"

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  manager: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  member: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  viewer: "bg-muted text-muted-foreground",
}

interface UsersTableProps {
  initialUsers: OrgUser[]
}

export function UsersTable({ initialUsers }: UsersTableProps) {
  const [users, setUsers] = useState(initialUsers)
  const [editingUser, setEditingUser] = useState<OrgUser | null>(null)
  const [resettingUser, setResettingUser] = useState<OrgUser | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <InviteUserDialog
          onInvited={(user) => setUsers((prev) => [...prev, user].sort((a, b) => a.fullName.localeCompare(b.fullName)))}
        />
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No users yet. Invite your first team member.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize border-0", ROLE_STYLES[user.role])}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingUser(user)}>
                          Edit user
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setResettingUser(user)}>
                          Reset password
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={Boolean(editingUser)}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onUpdated={(updated) => {
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
            setEditingUser(null)
          }}
          onDeactivated={(profileId) => {
            setUsers((prev) =>
              prev.map((u) => (u.id === profileId ? { ...u, isActive: false } : u))
            )
            setEditingUser(null)
          }}
        />
      )}

      {resettingUser && (
        <ResetPasswordDialog
          user={resettingUser}
          open={Boolean(resettingUser)}
          onOpenChange={(open) => !open && setResettingUser(null)}
        />
      )}
    </div>
  )
}
