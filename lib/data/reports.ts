import { loadDashboardData } from "@/lib/data/dashboard"
import { loadCustomersData } from "@/lib/data/accounts"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { listLineItemsForReports } from "@/lib/supabase/services/line-items"
import { jobs as mockJobs } from "@/lib/mock-data"
import type { Job, Account, Opportunity, LineItemWipStatus } from "@/types"
import type { LineItemsByJob } from "@/lib/reports/filters"

export interface ReportsDataset {
  jobs: Job[]
  opportunities: Opportunity[]
  customers: Account[]
  lineItemsByJob: LineItemsByJob
  source: "supabase" | "mock"
}

function buildLineItemsByJob(
  rows: { jobId: string; wipStatus: LineItemWipStatus }[]
): LineItemsByJob {
  const map: LineItemsByJob = {}
  for (const row of rows) {
    if (!map[row.jobId]) map[row.jobId] = []
    map[row.jobId].push(row.wipStatus)
  }
  return map
}

function buildLineItemsByJobFromMock(jobs: Job[]): LineItemsByJob {
  const map: LineItemsByJob = {}
  for (const job of jobs) {
    if (job.lineItems?.length) {
      map[job.id] = job.lineItems.map((li) => li.wipStatus)
    }
  }
  return map
}

async function loadLineItemsSummary(
  jobs: Job[],
  source: "supabase" | "mock"
): Promise<LineItemsByJob> {
  if (source === "supabase" && isSupabaseConfigured()) {
    try {
      const rows = await listLineItemsForReports()
      if (rows.length > 0) return buildLineItemsByJob(rows)
    } catch {
      // fall through to mock derivation
    }
  }
  return buildLineItemsByJobFromMock(jobs.length ? jobs : mockJobs)
}

export async function loadReportsData(): Promise<ReportsDataset> {
  const [{ jobs, opportunities, source }, { customers }] = await Promise.all([
    loadDashboardData(),
    loadCustomersData(),
  ])

  const lineItemsByJob = await loadLineItemsSummary(jobs, source)

  return {
    jobs,
    opportunities,
    customers,
    lineItemsByJob,
    source,
  }
}
