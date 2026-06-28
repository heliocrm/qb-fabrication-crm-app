import { ReportsMetricCards } from "@/components/reports/reports-metric-cards"
import { JobsByStatusChart } from "@/components/reports/jobs-by-status-chart"
import { RevenueByCustomerChart } from "@/components/reports/revenue-by-customer-chart"
import { DeliveryScheduleCard } from "@/components/reports/delivery-schedule-card"
import { ReportsSummaryCard } from "@/components/reports/reports-summary-card"
import { PipelineChart } from "@/components/dashboard/pipeline-chart"
import { loadReportsData } from "@/lib/data/reports"

export default async function ReportsPage() {
  const {
    metrics,
    jobsByStatus,
    revenueByCustomer,
    deliverySchedule,
    pipelineByStage,
    totalPipeline,
    bpaSharePct,
    source,
  } = await loadReportsData()

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Business metrics — jobs, revenue, pipeline, and delivery schedule
          {source === "supabase" && (
            <span className="ml-1 text-[var(--orange)]">· live data</span>
          )}
        </p>
      </div>

      <ReportsMetricCards metrics={metrics} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <JobsByStatusChart data={jobsByStatus} />
        <RevenueByCustomerChart data={revenueByCustomer} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <PipelineChart
            data={pipelineByStage}
            totalPipeline={totalPipeline}
            bpaSharePct={bpaSharePct}
          />
        </div>
        <div className="space-y-6">
          <DeliveryScheduleCard data={deliverySchedule} />
          <ReportsSummaryCard metrics={metrics} />
        </div>
      </div>
    </div>
  )
}
