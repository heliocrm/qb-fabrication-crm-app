import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNav } from "@/components/top-nav"
import { getUserProfile } from "@/lib/supabase/provision"

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUserProfile()

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar user={user} />
      <SidebarInset className="min-h-svh">
        <TopNav user={user} />
        <div className="flex-1 overflow-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
