import type { OrganizationRole } from "@/types"

export type SectionAccessMode = "always" | "admin" | "configurable"

export const ALL_ORGANIZATION_ROLES: OrganizationRole[] = [
  "admin",
  "manager",
  "member",
  "viewer",
]

/** Icon-free section metadata — safe for middleware / edge. */
export interface SectionDefinition {
  sectionKey: string
  label: string
  href: string
  description?: string
  access: SectionAccessMode
  defaultRoles: OrganizationRole[]
}

export const mainSectionDefinitions: SectionDefinition[] = [
  {
    sectionKey: "dashboard",
    label: "Dashboard",
    href: "/",
    description: "Shop overview and metrics",
    access: "always",
    defaultRoles: ALL_ORGANIZATION_ROLES,
  },
  {
    sectionKey: "opportunities",
    label: "Opportunities",
    href: "/opportunities",
    description: "Sales pipeline and bids",
    access: "configurable",
    defaultRoles: ALL_ORGANIZATION_ROLES,
  },
  {
    sectionKey: "jobs",
    label: "Jobs",
    href: "/jobs",
    description: "Active fabrication jobs",
    access: "configurable",
    defaultRoles: ALL_ORGANIZATION_ROLES,
  },
  {
    sectionKey: "material-requests",
    label: "Material Requests",
    href: "/material-requests",
    description: "Floor pull requests — Submission → Approval → Batch & Pull",
    access: "configurable",
    defaultRoles: ALL_ORGANIZATION_ROLES,
  },
  {
    sectionKey: "customers",
    label: "Customers",
    href: "/customers",
    description: "Utility accounts and contacts",
    access: "configurable",
    defaultRoles: ALL_ORGANIZATION_ROLES,
  },
  {
    sectionKey: "reports",
    label: "Reports",
    href: "/reports",
    description: "Analytics and exports",
    access: "configurable",
    defaultRoles: ALL_ORGANIZATION_ROLES,
  },
  {
    sectionKey: "settings",
    label: "Settings",
    href: "/settings",
    description: "Team and preferences",
    access: "always",
    defaultRoles: ALL_ORGANIZATION_ROLES,
  },
  {
    sectionKey: "help",
    label: "Help",
    href: "/help",
    description: "In-app user guide and cheat sheets",
    access: "always",
    defaultRoles: ALL_ORGANIZATION_ROLES,
  },
]

export const adminSectionDefinition: SectionDefinition = {
  sectionKey: "admin",
  label: "Admin",
  href: "/admin",
  description: "User management and organization",
  access: "admin",
  defaultRoles: ["admin"],
}

const allSectionDefinitions: SectionDefinition[] = [
  ...mainSectionDefinitions,
  adminSectionDefinition,
]

export function getSectionByKey(
  sectionKey: string
): SectionDefinition | undefined {
  return allSectionDefinitions.find((s) => s.sectionKey === sectionKey)
}

export function getConfigurableSectionDefinitions(): SectionDefinition[] {
  return mainSectionDefinitions.filter((s) => s.access === "configurable")
}

/** Map a pathname to its registry section key, or null if unmapped. */
export function sectionKeyForPath(pathname: string): string | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return adminSectionDefinition.sectionKey
  }

  const byHrefLength = [...mainSectionDefinitions].sort(
    (a, b) => b.href.length - a.href.length
  )

  for (const section of byHrefLength) {
    if (section.href === "/") {
      if (pathname === "/") return section.sectionKey
      continue
    }
    if (
      pathname === section.href ||
      pathname.startsWith(`${section.href}/`)
    ) {
      return section.sectionKey
    }
  }

  return null
}
