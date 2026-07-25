import { Suspense } from "react"
import { SettingsPageClient } from "@/components/settings/settings-page-client"
import { getSessionContext } from "@/lib/auth/session"
import { isAdminRole } from "@/lib/auth/permissions"

export default async function SettingsPage() {
  const ctx = await getSessionContext()
  const isAdmin = ctx ? isAdminRole(ctx.role) : false

  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <SettingsPageClient isAdmin={isAdmin} />
    </Suspense>
  )
}
