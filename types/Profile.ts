import type { OrganizationRole } from "./enums"
import type { Json } from "./database"

export interface NotificationPreferences {
  job_updates_email: boolean
  task_assignments_email: boolean
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  job_updates_email: true,
  task_assignments_email: true,
}

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
  avatar_url: string | null
  notification_preferences: Json
  created_at: string
  updated_at: string
}

export interface OwnProfile {
  id: string
  userId: string
  organizationId: string
  fullName: string
  email: string
  role: OrganizationRole
  avatarInitials: string
  avatarUrl: string | null
  notificationPreferences: NotificationPreferences
}

export interface ReportViewRow {
  id: string
  profile_id: string
  organization_id: string
  name: string
  filters: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ReportView {
  id: string
  name: string
  filters: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface JobAssigneeRow {
  job_id: string
  profile_id: string
  assigned_at: string
  assigned_by: string | null
}
