import type { OrganizationRole } from "./enums"

/** Lightweight profile for job assignee display and pickers */
export interface ProfileSummary {
  id: string
  fullName: string
  role: OrganizationRole
  avatarInitials: string
  isActive: boolean
}

/** Full org user row for admin user management */
export interface OrgUser {
  id: string
  userId: string
  organizationId: string
  fullName: string
  email: string
  role: OrganizationRole
  isActive: boolean
  avatarInitials: string
  createdAt: string
  updatedAt: string
}

export interface ProfileRow {
  id: string
  user_id: string
  organization_id: string
  full_name: string | null
  role: OrganizationRole
  is_active: boolean
  avatar_initials: string | null
  created_at: string
  updated_at: string
}

export interface JobAssigneeRow {
  job_id: string
  profile_id: string
  assigned_at: string
  assigned_by: string | null
}
