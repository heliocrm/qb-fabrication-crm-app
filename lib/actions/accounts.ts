"use server"

import { revalidatePath } from "next/cache"
import { canCreateJobs, requireSessionContext } from "@/lib/auth/session"
import { deriveShortName } from "@/lib/accounts/short-name"
import {
  createAccount,
  listAccounts,
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

/** Create account from company name only (auto short name). Used on New Job. */
export async function createAccountQuickAction(input: { name: string }) {
  const name = input.name?.trim()
  if (!name) {
    return { error: "Company name is required" }
  }

  const result = await safeAction(async () => {
    const ctx = await requireSessionContext()
    if (!canCreateJobs(ctx.role)) {
      throw new Error("Only managers and admins can create customers from New Job")
    }
    const existing = await listAccounts()
    const shortNames = new Set(
      existing.map((a) => a.shortName.trim().toLowerCase()).filter(Boolean)
    )
    const shortName = deriveShortName(name, shortNames)
    return createAccount({ name, shortName, status: "Active" })
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
