import type { AccountStatus } from "./enums"

export interface Account {
  id: string
  name: string
  shortName: string
  contact: string
  email: string
  phone: string
  city: string
  state: string
  totalJobs: number
  activeJobs: number
  totalValue: number
  ytdValue: number
  status: AccountStatus
  organizationId?: string
  createdAt?: string
  updatedAt?: string
}

/** @deprecated Use Account */
export type Customer = Account

export interface AccountRow {
  id: string
  organization_id: string
  name: string
  short_name: string
  contact: string | null
  email: string | null
  phone: string | null
  city: string | null
  state: string | null
  status: AccountStatus
  created_at: string
  updated_at: string
}

export interface OrganizationRow {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export interface ProfileRow {
  id: string
  user_id: string
  organization_id: string
  full_name: string | null
  role: string
  avatar_initials: string | null
  created_at: string
  updated_at: string
}

export interface TeamMember {
  name: string
  initials: string
  role: string
}
