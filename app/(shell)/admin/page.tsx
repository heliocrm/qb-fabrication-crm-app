import { redirect } from "next/navigation"
import { AdminPageClient } from "@/components/admin/admin-page-client"
import { getSessionContext, isAdminRole } from "@/lib/auth/session"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { listOrgUsers } from "@/lib/supabase/services/profiles"

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    redirect("/")
  }

  const ctx = await getSessionContext()
  if (!ctx || !isAdminRole(ctx.role)) {
    redirect("/")
  }

  const users = await listOrgUsers()

  return <AdminPageClient users={users} />
}
