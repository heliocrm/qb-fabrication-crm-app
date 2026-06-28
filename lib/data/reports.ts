import { loadDashboardData } from "@/lib/data/dashboard"
import { loadCustomersData } from "@/lib/data/accounts"
import {
  getReportsMetrics,
  getJobsByStatus,
  getRevenueByCustomer,
  getUpcomingDeliveriesByMonth,
} from "@/lib/reports-stats"
import { getPipelineByStage, getDashboardMetrics } from "@/lib/dashboard-stats"

export async function loadReportsData() {
  const [{ jobs, opportunities, source }, { customers }] = await Promise.all([
    loadDashboardData(),
    loadCustomersData(),
  ])

  const metrics = getReportsMetrics(jobs, opportunities)
  const jobsByStatus = getJobsByStatus(jobs)
  const revenueByCustomer = getRevenueByCustomer(jobs, customers)
  const deliverySchedule = getUpcomingDeliveriesByMonth(jobs)
  const pipelineByStage = getPipelineByStage(opportunities)
  const { totalPipeline, bpaSharePct } = getDashboardMetrics(jobs, opportunities)

  return {
    jobs,
    opportunities,
    customers,
    metrics,
    jobsByStatus,
    revenueByCustomer,
    deliverySchedule,
    pipelineByStage,
    totalPipeline,
    bpaSharePct,
    source,
  }
}
