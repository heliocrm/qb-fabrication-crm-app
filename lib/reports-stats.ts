import type { Job, Opportunity, Account, JobStatus } from "@/types"
import { formatCompact, getActiveOpportunities, getOpenJobs } from "@/lib/dashboard-stats"
import { isBpaAccount } from "@/lib/seed-ids"

export { formatCompact }

const JOB_STATUSES: JobStatus[] = [
  "To Do",
  "In Progress",
  "QC",
  "Shipping",
  "Delivered",
]

export interface ReportsMetrics {
  totalRevenue: number
  openJobValue: number
  pipelineValue: number
  weightedPipeline: number
  avgJobValue: number
  totalTonnage: number
  winRate: number
  openJobsCount: number
  deliveredCount: number
  activeOppsCount: number
  bpaRevenueShare: number
}

export interface JobsByStatusDatum {
  status: JobStatus
  count: number
  value: number
}

export interface RevenueByCustomerDatum {
  customer: string
  shortName: string
  value: number
  jobCount: number
}

export interface MonthlyDeliveryDatum {
  month: string
  count: number
  value: number
}

export function getReportsMetrics(
  jobs: Job[],
  opportunities: Opportunity[]
): ReportsMetrics {
  const openJobs = getOpenJobs(jobs)
  const deliveredJobs = jobs.filter((j) => j.status === "Delivered")
  const activeOpps = getActiveOpportunities(opportunities)
  const wonOpps = opportunities.filter((o) => o.stage === "Won")
  const lostOpps = opportunities.filter((o) => o.stage === "Lost")
  const closedCount = wonOpps.length + lostOpps.length

  const totalRevenue = deliveredJobs.reduce((s, j) => s + j.value, 0)
  const openJobValue = openJobs.reduce((s, j) => s + j.value, 0)
  const pipelineValue = activeOpps.reduce((s, o) => s + o.value, 0)
  const weightedPipeline = activeOpps.reduce(
    (s, o) => s + o.value * (o.probability / 100),
    0
  )
  const totalTonnage = jobs.reduce((s, j) => s + (j.tonnage ?? 0), 0)
  const avgJobValue =
    jobs.length > 0 ? jobs.reduce((s, j) => s + j.value, 0) / jobs.length : 0
  const winRate =
    closedCount > 0 ? Math.round((wonOpps.length / closedCount) * 100) : 0

  const bpaRevenue = deliveredJobs
    .filter((j) => isBpaAccount(j.customerId))
    .reduce((s, j) => s + j.value, 0)
  const bpaRevenueShare =
    totalRevenue > 0 ? Math.round((bpaRevenue / totalRevenue) * 100) : 0

  return {
    totalRevenue,
    openJobValue,
    pipelineValue,
    weightedPipeline,
    avgJobValue,
    totalTonnage,
    winRate,
    openJobsCount: openJobs.length,
    deliveredCount: deliveredJobs.length,
    activeOppsCount: activeOpps.length,
    bpaRevenueShare,
  }
}

export function getJobsByStatus(jobs: Job[]): JobsByStatusDatum[] {
  return JOB_STATUSES.map((status) => {
    const statusJobs = jobs.filter((j) => j.status === status)
    return {
      status,
      count: statusJobs.length,
      value: statusJobs.reduce((s, j) => s + j.value, 0),
    }
  }).filter((d) => d.count > 0)
}

export function getRevenueByCustomer(
  jobs: Job[],
  accounts: Account[]
): RevenueByCustomerDatum[] {
  return accounts
    .map((account) => {
      const customerJobs = jobs.filter(
        (j) => j.customerId === account.id || j.customer === account.name
      )
      return {
        customer: account.name,
        shortName: account.shortName,
        value: customerJobs.reduce((s, j) => s + j.value, 0),
        jobCount: customerJobs.length,
      }
    })
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
}

export function getUpcomingDeliveriesByMonth(jobs: Job[]): MonthlyDeliveryDatum[] {
  const openJobs = getOpenJobs(jobs).filter((j) => j.deliveryDate)
  const byMonth = new Map<string, { count: number; value: number }>()

  for (const job of openJobs) {
    const date = new Date(job.deliveryDate)
    const key = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    const existing = byMonth.get(key) ?? { count: 0, value: 0 }
    byMonth.set(key, {
      count: existing.count + 1,
      value: existing.value + job.value,
    })
  }

  return Array.from(byMonth.entries())
    .map(([month, data]) => ({ month, ...data }))
    .slice(0, 6)
}
