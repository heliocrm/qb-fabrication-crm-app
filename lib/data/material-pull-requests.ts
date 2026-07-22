import { isSupabaseConfigured } from "@/lib/supabase/env"
import {
  getMaterialPullSummary,
  listMaterialPullRequests,
} from "@/lib/supabase/services/material-pull-requests"
import type { MaterialPullListFilters, MaterialPullRequest } from "@/types"

export async function loadMaterialPullRequests(
  filters: MaterialPullListFilters = {}
): Promise<{
  requests: MaterialPullRequest[]
  source: "supabase" | "empty"
}> {
  if (!isSupabaseConfigured()) {
    return { requests: [], source: "empty" }
  }

  try {
    const requests = await listMaterialPullRequests(filters)
    return { requests, source: "supabase" }
  } catch {
    return { requests: [], source: "empty" }
  }
}

export async function loadMaterialPullSummary(): Promise<{
  pending: number
  sourced: number
  batched: number
  pulled: number
  cancelled: number
} | null> {
  if (!isSupabaseConfigured()) return null
  try {
    return await getMaterialPullSummary()
  } catch {
    return null
  }
}
