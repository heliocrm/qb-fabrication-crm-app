"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Briefcase,
  Building2,
  ChevronRight,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Wrench,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Opportunities", href: "/opportunities", icon: TrendingUp },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Customers", href: "/customers", icon: Building2 },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[var(--orange)]">
            <Wrench className="size-5 text-white" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold text-sidebar-foreground tracking-wide">QB Fabrication</span>
            <span className="text-xs text-sidebar-foreground/60">Shop Management</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2 group-data-[collapsible=icon]:justify-center">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-[var(--orange)] text-white text-xs font-semibold">
              IC
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-semibold text-sidebar-foreground">Ivy Chen</span>
            <span className="text-xs text-sidebar-foreground/60">Project Manager</span>
          </div>
          <ChevronRight className="ml-auto size-3.5 text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
