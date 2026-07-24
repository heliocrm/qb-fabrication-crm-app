import type { MaterialPullCapabilities, OrganizationRole } from "@/types"
import { DEFAULT_MATERIAL_PULL_CAPABILITIES } from "@/types/Profile"

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

export function parseMaterialPullCapabilities(
  raw: unknown
): MaterialPullCapabilities {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_MATERIAL_PULL_CAPABILITIES }
  }
  const obj = raw as Record<string, unknown>
  return {
    can_request: obj.can_request === true,
    can_approve: obj.can_approve === true,
    can_batch: obj.can_batch === true,
    can_approve_allocation: obj.can_approve_allocation === true,
  }
}

export function canCreateMaterialRequests(
  role: OrganizationRole,
  caps: MaterialPullCapabilities = DEFAULT_MATERIAL_PULL_CAPABILITIES
): boolean {
  if (role === "admin") return true
  if (role === "viewer") return false
  return caps.can_request === true
}

export function canApproveMaterialRequests(
  role: OrganizationRole,
  caps: MaterialPullCapabilities = DEFAULT_MATERIAL_PULL_CAPABILITIES
): boolean {
  if (role === "admin") return true
  return caps.can_approve === true
}

export function canBatchMaterialRequests(
  role: OrganizationRole,
  caps: MaterialPullCapabilities = DEFAULT_MATERIAL_PULL_CAPABILITIES
): boolean {
  if (role === "admin") return true
  return caps.can_batch === true
}

export function canApproveMaterialAllocation(
  role: OrganizationRole,
  caps: MaterialPullCapabilities = DEFAULT_MATERIAL_PULL_CAPABILITIES
): boolean {
  if (role === "admin") return true
  return caps.can_approve_allocation === true
}

/** Legacy: any seat that can approve or batch (list chrome / cancel as manager). */
export function canManageMaterialRequests(
  role: OrganizationRole,
  caps: MaterialPullCapabilities = DEFAULT_MATERIAL_PULL_CAPABILITIES
): boolean {
  return (
    canApproveMaterialRequests(role, caps) ||
    canBatchMaterialRequests(role, caps) ||
    canApproveMaterialAllocation(role, caps)
  )
}

export function canViewMaterialRequests(role: OrganizationRole): boolean {
  return (
    role === "admin" ||
    role === "manager" ||
    role === "member" ||
    role === "viewer"
  )
}
