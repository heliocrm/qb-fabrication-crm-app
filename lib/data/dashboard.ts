import { loadJobsForDashboard } from "@/lib/data/jobs"
import { loadOpportunities } from "@/lib/data/opportunities"
import type { Job, Opportunity } from "@/types"

export async function loadDashboardData(): Promise<{
  jobs: Job[]
  opportunities: Opportunity[]
  source: "supabase" | "mock"
}> {
  const [jobs, { opportunities, source }] = await Promise.all([
    loadJobsForDashboard(),
    loadOpportunities(),
  ])

  return { jobs, opportunities, source }
}
