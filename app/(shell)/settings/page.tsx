import { SettingsPageClient } from "@/components/settings/settings-page-client"
import { getSessionContext } from "@/lib/auth/session"
import { isAdminRole } from "@/lib/auth/permissions"

export default async function SettingsPage() {
  const ctx = await getSessionContext()
  const isAdmin = ctx ? isAdminRole(ctx.role) : false

  return <SettingsPageClient isAdmin={isAdmin} />
}
