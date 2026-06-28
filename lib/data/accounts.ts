import { isSupabaseConfigured } from "@/lib/supabase/env"
import { listAccounts } from "@/lib/supabase/services/accounts"
import { accounts as mockAccounts, jobs as mockJobs, opportunities as mockOpportunities } from "@/lib/mock-data"
import { loadJobs } from "@/lib/data/jobs"
import { loadOpportunities } from "@/lib/data/opportunities"
import { resolveAccountId } from "@/lib/seed-ids"
import type { Account, Job, Opportunity } from "@/types"

export interface Customer360 extends Account {
  jobs: Job[]
  opportunities: Opportunity[]
}

function matchesAccount(job: Job, account: Account): boolean {
  const resolvedId = resolveAccountId(account.id)
  return (
    job.customerId === account.id ||
    job.accountId === resolvedId ||
    job.accountId === account.id
  )
}

function computeAccountStats(account: Account, jobs: Job[]): Account {
  const customerJobs = jobs.filter((j) => matchesAccount(j, account))
  const activeJobs = customerJobs.filter((j) => j.status !== "Delivered")
  const totalValue = customerJobs.reduce((sum, j) => sum + j.value, 0)
  const currentYear = new Date().getFullYear()
  const ytdValue = customerJobs
    .filter((j) => {
      const date = j.deliveryDate || j.startDate
      if (!date) return false
      return new Date(date).getFullYear() === currentYear
    })
    .reduce((sum, j) => sum + j.value, 0)

  return {
    ...account,
    totalJobs: customerJobs.length,
    activeJobs: activeJobs.length,
    totalValue,
    ytdValue,
  }
}

function buildCustomer360(
  account: Account,
  jobs: Job[],
  opportunities: Opportunity[]
): Customer360 {
  const withStats = computeAccountStats(account, jobs)
  const customerJobs = jobs
    .filter((j) => matchesAccount(j, withStats))
    .sort(
      (a, b) =>
        new Date(b.deliveryDate || b.startDate || 0).getTime() -
        new Date(a.deliveryDate || a.startDate || 0).getTime()
    )
  const customerOpps = opportunities.filter(
    (o) =>
      o.customerId === withStats.id ||
      o.accountId === resolveAccountId(withStats.id) ||
      o.accountId === withStats.id
  )

  return {
    ...withStats,
    jobs: customerJobs,
    opportunities: customerOpps,
  }
}

/** Load all customers with job history and computed stats */
export async function loadCustomersData(): Promise<{
  customers: Customer360[]
  source: "supabase" | "mock"
}> {
  const [{ jobs, source: jobsSource }, { opportunities }] = await Promise.all([
    loadJobs(),
    loadOpportunities(),
  ])

  if (isSupabaseConfigured()) {
    try {
      const accounts = await listAccounts()
      if (accounts.length > 0) {
        const customers = accounts.map((a) =>
          buildCustomer360(a, jobs, opportunities)
        )
        return { customers, source: "supabase" }
      }
    } catch {
      // fall through to mock
    }
  }

  const customers = mockAccounts.map((a) =>
    buildCustomer360(a, jobsSource === "mock" ? mockJobs : jobs, opportunities)
  )
  return { customers, source: jobsSource === "supabase" ? "supabase" : "mock" }
}
