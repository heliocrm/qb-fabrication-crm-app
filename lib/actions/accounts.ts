"use server"

import { revalidatePath } from "next/cache"
import { requireSessionContext } from "@/lib/auth/session"
import {
  createAccount,
  updateAccount,
} from "@/lib/supabase/services/accounts"
import { resolveAccountId } from "@/lib/seed-ids"
import { SupabaseServiceError } from "@/lib/supabase/schema"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import type { AccountStatus } from "@/types"

async function safeAction<T>(fn: () => Promise<T>): Promise<{ data?: T; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured" }
  }
  try {
    const data = await fn()
    return { data }
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

function revalidateAccountPaths() {
  revalidatePath("/customers")
  revalidatePath("/jobs")
  revalidatePath("/jobs/new")
  revalidatePath("/opportunities")
  revalidatePath("/opportunities/new")
}

export async function createAccountAction(input: {
  name: string
  shortName: string
  contact?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  state?: string | null
  status?: AccountStatus
  qbCustomerUrl?: string | null
  qbCustomerId?: string | null
  qbStatusNote?: string | null
}) {
  if (!input.name?.trim() || !input.shortName?.trim()) {
    return { error: "Name and short name are required" }
  }

  const result = await safeAction(async () => {
    await requireSessionContext()
    return createAccount(input)
  })
  if (result.data) revalidateAccountPaths()
  return result
}

export async function updateAccountAction(
  id: string,
  input: {
    name?: string
    shortName?: string
    contact?: string | null
    email?: string | null
    phone?: string | null
    city?: string | null
    state?: string | null
    status?: AccountStatus
    qbCustomerUrl?: string | null
    qbCustomerId?: string | null
    qbStatusNote?: string | null
  }
) {
  if (!id?.trim()) return { error: "Account id is required" }

  const result = await safeAction(async () => {
    await requireSessionContext()
    return updateAccount(resolveAccountId(id), input)
  })
  if (result.data) revalidateAccountPaths()
  return result
}
