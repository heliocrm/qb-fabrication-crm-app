import { loadDashboardData } from "@/lib/data/dashboard"
import { loadCustomersData } from "@/lib/data/accounts"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { listLineItemsForReports } from "@/lib/supabase/services/line-items"
import { listMaterialPullRequests } from "@/lib/supabase/services/material-pull-requests"
import { jobs as mockJobs } from "@/lib/mock-data"
import type {
  Job,
  Account,
  Opportunity,
  LineItemWipStatus,
  MaterialPullRequest,
} from "@/types"
import type { LineItemsByJob } from "@/lib/reports/filters"

export interface ReportsDataset {
  jobs: Job[]
  opportunities: Opportunity[]
  customers: Account[]
  lineItemsByJob: LineItemsByJob
  materialPullRequests: MaterialPullRequest[]
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

async function loadMaterialPullsForReports(
  source: "supabase" | "mock"
): Promise<MaterialPullRequest[]> {
  if (source !== "supabase" || !isSupabaseConfigured()) return []
  try {
    return await listMaterialPullRequests({ status: "all" })
  } catch {
    return []
  }
}

export async function loadReportsData(): Promise<ReportsDataset> {
  const [{ jobs, opportunities, source }, { customers }] = await Promise.all([
    loadDashboardData(),
    loadCustomersData(),
  ])

  const [lineItemsByJob, materialPullRequests] = await Promise.all([
    loadLineItemsSummary(jobs, source),
    loadMaterialPullsForReports(source),
  ])

  return {
    jobs,
    opportunities,
    customers,
    lineItemsByJob,
    materialPullRequests,
    source,
  }
}
