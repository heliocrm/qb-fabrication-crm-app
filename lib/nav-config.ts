import {
  BarChart3,
  Briefcase,
  Building2,
  HelpCircle,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import {
  ALL_ORGANIZATION_ROLES,
  adminSectionDefinition,
  getConfigurableSectionDefinitions,
  getSectionByKey,
  mainSectionDefinitions,
  sectionKeyForPath,
  type SectionAccessMode,
  type SectionDefinition,
} from "@/lib/section-registry"

export {
  ALL_ORGANIZATION_ROLES,
  getSectionByKey,
  sectionKeyForPath,
  type SectionAccessMode,
}

export type { SectionDefinition }

export interface NavItem extends SectionDefinition {
  icon: LucideIcon
}

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  opportunities: TrendingUp,
  jobs: Briefcase,
  "material-requests": Package,
  customers: Building2,
  reports: BarChart3,
  settings: Settings,
  admin: Shield,
  help: HelpCircle,
}

function toNavItem(section: SectionDefinition): NavItem {
  const icon = ICONS[section.sectionKey]
  if (!icon) {
    throw new Error(`Missing icon for section "${section.sectionKey}"`)
  }
  return { ...section, icon }
}

export const mainNavItems: NavItem[] = mainSectionDefinitions.map(toNavItem)

export const adminNavItem: NavItem = toNavItem(adminSectionDefinition)

export function getNavItemBySectionKey(
  sectionKey: string
): NavItem | undefined {
  const section = getSectionByKey(sectionKey)
  return section ? toNavItem(section) : undefined
}

export function getConfigurableSections(): NavItem[] {
  return getConfigurableSectionDefinitions().map(toNavItem)
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}
