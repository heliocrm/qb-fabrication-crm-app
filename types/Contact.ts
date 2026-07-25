export interface Contact {
  id: string
  organizationId: string
  accountId: string
  fullName: string
  roleTitle: string
  email: string
  phone: string
  preferredChannel: string
  personalNotes: string
  relationshipOwnerId: string | null
  lastContactAt: string | null
  nextTouchAt: string | null
  nextTouchOwnerId: string | null
  isPrimary: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ContactRow {
  id: string
  organization_id: string
  account_id: string
  full_name: string
  role_title: string | null
  email: string | null
  phone: string | null
  preferred_channel: string | null
  personal_notes: string | null
  relationship_owner_id: string | null
  last_contact_at: string | null
  next_touch_at: string | null
  next_touch_owner_id: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface ContactInsert {
  organization_id: string
  account_id: string
  full_name: string
  role_title?: string | null
  email?: string | null
  phone?: string | null
  preferred_channel?: string | null
  personal_notes?: string | null
  relationship_owner_id?: string | null
  last_contact_at?: string | null
  next_touch_at?: string | null
  next_touch_owner_id?: string | null
  is_primary?: boolean
}

export type ContactUpdate = Partial<
  Omit<ContactInsert, "organization_id" | "account_id">
>
