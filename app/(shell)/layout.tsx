import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNav } from "@/components/top-nav"
import { getSessionContext } from "@/lib/auth/session"
import { loadSectionAccessMatrix } from "@/lib/auth/load-section-access"
import { getVisibleSectionKeys } from "@/lib/auth/section-access"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { getUserProfile } from "@/lib/supabase/provision"

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUserProfile()

  let visibleSectionKeys: string[] | null = null
  if (isSupabaseConfigured()) {
    const ctx = await getSessionContext()
    if (ctx) {
      const matrix = await loadSectionAccessMatrix(ctx.organizationId)
      visibleSectionKeys = getVisibleSectionKeys(ctx.role, matrix)
    }
  }

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar user={user} visibleSectionKeys={visibleSectionKeys} />
      <SidebarInset className="min-h-svh">
        <TopNav user={user} />
        <div className="flex-1 overflow-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
