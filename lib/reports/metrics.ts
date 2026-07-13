import type { Job, Opportunity } from "@/types"
import { getActiveOpportunities } from "@/lib/dashboard-stats"
import {
  getReportsMetrics,
  getJobsByStatus,
  getRevenueByCustomer,
  getUpcomingDeliveriesByMonth,
  type ReportsMetrics,
  type JobsByStatusDatum,
  type RevenueByCustomerDatum,
  type MonthlyDeliveryDatum,
} from "@/lib/reports-stats"
import { getPipelineByStage, getDashboardMetrics } from "@/lib/dashboard-stats"
import type { Account } from "@/types"

export interface CoreReportsMetrics {
  totalJobs: number
  pipelineValue: number
  completionPct: number
  onTimeDeliveryPct: number
}

function dateOnly(value: string | null | undefined): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

export function getCoreReportsMetrics(
  jobs: Job[],
  opportunities: Opportunity[]
): CoreReportsMetrics {
  const activeOpps = getActiveOpportunities(opportunities)
  const pipelineValue = activeOpps.reduce((sum, o) => sum + o.value, 0)

  const completionPct =
    jobs.length > 0
      ? Math.round(jobs.reduce((sum, j) => sum + j.progress, 0) / jobs.length)
      : 0

  const deliveredJobs = jobs.filter((j) => j.status === "Delivered")
  let onTimeDeliveryPct = 0
  if (deliveredJobs.length > 0) {
    const onTime = deliveredJobs.filter((j) => {
      const delivery = dateOnly(j.deliveryDate)
      const updated = dateOnly(j.updatedAt ?? j.createdAt)
      if (!delivery || !updated) return j.progress >= 100
      return updated <= delivery
    }).length
    onTimeDeliveryPct = Math.round((onTime / deliveredJobs.length) * 100)
  }

  return {
    totalJobs: jobs.length,
    pipelineValue,
    completionPct,
    onTimeDeliveryPct,
  }
}

export interface ReportsComputedData {
  coreMetrics: CoreReportsMetrics
  metrics: ReportsMetrics
  jobsByStatus: JobsByStatusDatum[]
  revenueByCustomer: RevenueByCustomerDatum[]
  deliverySchedule: MonthlyDeliveryDatum[]
  pipelineByStage: ReturnType<typeof getPipelineByStage>
  totalPipeline: number
  bpaSharePct: number
}

export function computeReportsData(
  jobs: Job[],
  opportunities: Opportunity[],
  customers: Account[]
): ReportsComputedData {
  const metrics = getReportsMetrics(jobs, opportunities)
  const { totalPipeline, bpaSharePct } = getDashboardMetrics(jobs, opportunities)

  return {
    coreMetrics: getCoreReportsMetrics(jobs, opportunities),
    metrics,
    jobsByStatus: getJobsByStatus(jobs),
    revenueByCustomer: getRevenueByCustomer(jobs, customers),
    deliverySchedule: getUpcomingDeliveriesByMonth(jobs),
    pipelineByStage: getPipelineByStage(opportunities),
    totalPipeline,
    bpaSharePct,
  }
}
