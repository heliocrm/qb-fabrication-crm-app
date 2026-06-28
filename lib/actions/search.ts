"use server"

import { searchMockData } from "@/lib/data/search"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { globalSearch } from "@/lib/supabase/services/search"
import { SupabaseServiceError } from "@/lib/supabase/schema"
import type { GlobalSearchResult } from "@/lib/search-types"

export async function globalSearchAction(
  query: string
): Promise<{ data?: GlobalSearchResult[]; error?: string }> {
  const trimmed = query.trim()
  if (!trimmed) {
    return { data: [] }
  }

  if (!isSupabaseConfigured()) {
    return { data: searchMockData(trimmed) }
  }

  try {
    const data = await globalSearch(trimmed)
    return { data }
  } catch (err) {
    const message =
      err instanceof SupabaseServiceError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Search failed"

    // Fall back to mock data if Supabase errors (e.g. unauthenticated dev session)
    try {
      const fallback = searchMockData(trimmed)
      if (fallback.length > 0) {
        return { data: fallback }
      }
    } catch {
      // ignore
    }

    return { error: message }
  }
}
