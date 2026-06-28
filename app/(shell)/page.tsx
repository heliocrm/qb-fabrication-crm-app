import { DashboardMetricCards } from "@/components/dashboard/metric-cards"
import { RecentJobsTable } from "@/components/dashboard/recent-jobs-table"
import { PipelineChart } from "@/components/dashboard/pipeline-chart"
import { DashboardQuickActions } from "@/components/dashboard/quick-actions"
import { UpcomingDeliveries } from "@/components/dashboard/upcoming-deliveries"
import { loadDashboardData } from "@/lib/data/dashboard"
import {
  getDashboardMetrics,
  getPipelineByStage,
} from "@/lib/dashboard-stats"

export default async function DashboardPage() {
  const { jobs, opportunities, source } = await loadDashboardData()
  const { totalPipeline, bpaSharePct } = getDashboardMetrics(jobs, opportunities)
  const pipelineData = getPipelineByStage(opportunities)

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Shop overview · BPA accounts for the majority of active work
            {source === "supabase" && (
              <span className="ml-1 text-[var(--orange)]">· live data</span>
            )}
          </p>
        </div>
        <DashboardQuickActions />
      </div>

      <DashboardMetricCards jobs={jobs} opportunities={opportunities} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <RecentJobsTable jobs={jobs} />
        </div>

        <div className="space-y-6">
          <PipelineChart
            data={pipelineData}
            totalPipeline={totalPipeline}
            bpaSharePct={bpaSharePct}
          />
          <UpcomingDeliveries jobs={jobs} />
        </div>
      </div>
    </div>
  )
}
