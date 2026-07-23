import type { OrganizationRole } from "@/types"

export function canWriteJobs(role: OrganizationRole): boolean {
  return role === "admin" || role === "manager" || role === "member"
}

export function canManageAssignees(role: OrganizationRole): boolean {
  return role === "admin" || role === "manager"
}

export function canCreateJobs(role: OrganizationRole): boolean {
  return role === "admin" || role === "manager"
}

export function isAdminRole(role: OrganizationRole): boolean {
  return role === "admin"
}

export function canCreateMaterialRequests(role: OrganizationRole): boolean {
  return role === "admin" || role === "manager" || role === "member"
}

export function canManageMaterialRequests(role: OrganizationRole): boolean {
  return role === "admin" || role === "manager"
}

export function canViewMaterialRequests(role: OrganizationRole): boolean {
  return (
    role === "admin" ||
    role === "manager" ||
    role === "member" ||
    role === "viewer"
  )
}
