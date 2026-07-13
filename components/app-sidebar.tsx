"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { UserMenu, type UserProfile } from "@/components/user-menu"
import { mainNavItems, adminNavItem, isNavActive } from "@/lib/nav-config"
import { cn } from "@/lib/utils"

interface AppSidebarProps {
  user?: UserProfile | null
}

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string
  label: string
  icon: LucideIcon
  isActive: boolean
}) {
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarMenuButton
      isActive={isActive}
      tooltip={label}
      className={cn(
        "transition-colors",
        isActive &&
          "bg-sidebar-accent text-sidebar-accent-foreground font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:rounded-full before:bg-[var(--orange)]"
      )}
      render={
        <Link
          href={href}
          onClick={() => {
            if (isMobile) setOpenMobile(false)
          }}
        />
      }
    >
      <Icon className={cn(isActive && "text-[var(--orange)]")} />
      <span>{label}</span>
    </SidebarMenuButton>
  )
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <Link
          href="/"
          className="flex items-center group-data-[collapsible=icon]:justify-center"
          aria-label="QB Fabrication home"
        >
          <BrandLogo
            size="md"
            className="group-data-[collapsible=icon]:hidden"
            priority
          />
          <BrandLogo
            size="sm"
            className="hidden !size-8 !max-w-none object-cover object-left group-data-[collapsible=icon]:block"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 px-2">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <NavLink
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    isActive={isNavActive(pathname, item.href)}
                  />
                </SidebarMenuItem>
              ))}
              {user?.organizationRole === "admin" && (
                <SidebarMenuItem>
                  <NavLink
                    href={adminNavItem.href}
                    label={adminNavItem.label}
                    icon={adminNavItem.icon}
                    isActive={isNavActive(pathname, adminNavItem.href)}
                  />
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <UserMenu user={user} variant="sidebar" />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
