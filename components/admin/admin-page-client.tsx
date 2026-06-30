"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrgSettingsPlaceholder } from "@/components/admin/org-settings-placeholder"
import { UsersTable } from "@/components/admin/users-table"
import type { OrgUser } from "@/types"

interface AdminPageClientProps {
  users: OrgUser[]
}

export function AdminPageClient({ users }: AdminPageClientProps) {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage team access, roles, and organization settings
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="org">Organization Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTable initialUsers={users} />
        </TabsContent>

        <TabsContent value="org">
          <OrgSettingsPlaceholder />
        </TabsContent>
      </Tabs>
    </div>
  )
}
