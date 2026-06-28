import { isSupabaseConfigured } from "@/lib/supabase/env"
import { listOpportunities } from "@/lib/supabase/services/opportunities"
import { opportunities as mockOpportunities } from "@/lib/mock-data"
import type { Opportunity } from "@/types"

export async function loadOpportunities(): Promise<{
  opportunities: Opportunity[]
  source: "supabase" | "mock"
  error?: string
}> {
  if (!isSupabaseConfigured()) {
    return { opportunities: mockOpportunities, source: "mock" }
  }

  try {
    const opportunities = await listOpportunities()
    return { opportunities, source: "supabase" }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load opportunities"
    return { opportunities: [], source: "supabase", error: message }
  }
}
