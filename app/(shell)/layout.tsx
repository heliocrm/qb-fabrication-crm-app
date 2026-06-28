import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNav } from "@/components/top-nav"

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopNav />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
