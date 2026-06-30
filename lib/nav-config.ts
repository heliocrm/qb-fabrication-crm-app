import {
  BarChart3,
  Briefcase,
  Building2,
  LayoutDashboard,
  Settings,
  Shield,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  description?: string
}

export const mainNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Shop overview and metrics",
  },
  {
    label: "Opportunities",
    href: "/opportunities",
    icon: TrendingUp,
    description: "Sales pipeline and bids",
  },
  {
    label: "Jobs",
    href: "/jobs",
    icon: Briefcase,
    description: "Active fabrication jobs",
  },
  {
    label: "Customers",
    href: "/customers",
    icon: Building2,
    description: "Utility accounts and contacts",
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    description: "Analytics and exports",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Team and preferences",
  },
]

export const adminNavItem: NavItem = {
  label: "Admin",
  href: "/admin",
  icon: Shield,
  description: "User management and organization",
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}
