import {
  getConfigurableSectionDefinitions,
  getSectionByKey,
  mainSectionDefinitions,
  type SectionDefinition,
} from "@/lib/section-registry"
import type { OrganizationRole } from "@/types"

/** sectionKey → role → enabled override from the org table */
export type SectionAccessMatrix = Record<
  string,
  Partial<Record<OrganizationRole, boolean>>
>

export function canViewSection(
  role: OrganizationRole,
  sectionKey: string,
  matrix: SectionAccessMatrix
): boolean {
  const item = getSectionByKey(sectionKey)
  if (!item) return false

  if (item.access === "always") return true
  if (item.access === "admin") return role === "admin"

  const override = matrix[sectionKey]?.[role]
  if (typeof override === "boolean") return override

  return item.defaultRoles.includes(role)
}

/** Effective enabled flag for Admin UI (override or registry default). */
export function isSectionEnabledForRole(
  sectionKey: string,
  role: OrganizationRole,
  matrix: SectionAccessMatrix
): boolean {
  const item = getSectionByKey(sectionKey)
  if (!item || item.access !== "configurable") return false

  const override = matrix[sectionKey]?.[role]
  if (typeof override === "boolean") return override

  return item.defaultRoles.includes(role)
}

export function getSectionsForRole(
  role: OrganizationRole,
  matrix: SectionAccessMatrix
): SectionDefinition[] {
  return mainSectionDefinitions.filter((item) =>
    canViewSection(role, item.sectionKey, matrix)
  )
}

export function getVisibleSectionKeys(
  role: OrganizationRole,
  matrix: SectionAccessMatrix
): string[] {
  return getSectionsForRole(role, matrix).map((item) => item.sectionKey)
}

/** Build the Admin matrix display model from registry + org overrides. */
export function buildSectionAccessDisplay(
  matrix: SectionAccessMatrix
): Array<{
  sectionKey: string
  label: string
  roles: Record<OrganizationRole, boolean>
}> {
  return getConfigurableSectionDefinitions().map((section) => ({
    sectionKey: section.sectionKey,
    label: section.label,
    roles: {
      admin: isSectionEnabledForRole(section.sectionKey, "admin", matrix),
      manager: isSectionEnabledForRole(section.sectionKey, "manager", matrix),
      member: isSectionEnabledForRole(section.sectionKey, "member", matrix),
      viewer: isSectionEnabledForRole(section.sectionKey, "viewer", matrix),
    },
  }))
}
