"use server"

import { revalidatePath } from "next/cache"
import { requireSessionContext } from "@/lib/auth/session"
import {
  createContact,
  listContactsByAccountId,
  updateContact,
} from "@/lib/supabase/services/contacts"
import { SupabaseServiceError } from "@/lib/supabase/schema"
import { isSupabaseConfigured } from "@/lib/supabase/env"

async function safeAction<T>(fn: () => Promise<T>): Promise<{ data?: T; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured" }
  }
  try {
    return { data: await fn() }
  } catch (err) {
    const message =
      err instanceof SupabaseServiceError
        ? err.message
        : err instanceof Error
          ? err.message
          : "An unexpected error occurred"
    return { error: message }
  }
}

function revalidateCustomerPaths() {
  revalidatePath("/customers")
}

export async function listContactsByAccountAction(accountId: string) {
  return safeAction(async () => {
    await requireSessionContext()
    return listContactsByAccountId(accountId)
  })
}

export async function createContactAction(input: {
  accountId: string
  fullName: string
  roleTitle?: string | null
  email?: string | null
  phone?: string | null
  preferredChannel?: string | null
  personalNotes?: string | null
  nextTouchAt?: string | null
  isPrimary?: boolean
  claimOwnership?: boolean
}) {
  if (!input.fullName?.trim()) {
    return { error: "Contact name is required" }
  }
  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    const { claimOwnership, ...rest } = input
    return createContact({
      ...rest,
      relationshipOwnerId: claimOwnership ? ctx.profileId : undefined,
      nextTouchOwnerId: claimOwnership ? ctx.profileId : undefined,
    })
  })
  if (result.data) {
    revalidateCustomerPaths()
    revalidatePath("/customers/needs-a-touch")
  }
  return result
}

export async function updateContactAction(
  id: string,
  input: {
    fullName?: string
    roleTitle?: string | null
    email?: string | null
    phone?: string | null
    preferredChannel?: string | null
    personalNotes?: string | null
    nextTouchAt?: string | null
    isPrimary?: boolean
    claimOwnership?: boolean
    clearOwnership?: boolean
  }
) {
  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    const { claimOwnership, clearOwnership, ...rest } = input
    return updateContact(id, {
      ...rest,
      ...(claimOwnership
        ? {
            relationshipOwnerId: ctx.profileId,
            nextTouchOwnerId: ctx.profileId,
          }
        : {}),
      ...(clearOwnership
        ? { relationshipOwnerId: null, nextTouchOwnerId: null }
        : {}),
    })
  })
  if (result.data) {
    revalidateCustomerPaths()
    revalidatePath("/customers/needs-a-touch")
  }
  return result
}
