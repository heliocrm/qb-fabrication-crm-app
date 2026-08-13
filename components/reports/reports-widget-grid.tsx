"use client"

import { ReportsCoreMetrics } from "@/components/reports/reports-core-metrics"
import { JobsByStatusChart } from "@/components/reports/jobs-by-status-chart"
import { RevenueByCustomerChart } from "@/components/reports/revenue-by-customer-chart"
import { DeliveryScheduleCard } from "@/components/reports/delivery-schedule-card"
import { ReportsSummaryCard } from "@/components/reports/reports-summary-card"
import { PullReasonsChart } from "@/components/reports/pull-reasons-chart"
import { PipelineChart } from "@/components/dashboard/pipeline-chart"
import { REPORTS_WIDGETS, spanClassName } from "@/lib/reports/widgets"
import type { ReportsComputedData } from "@/lib/reports/metrics"
import { cn } from "@/lib/utils"

interface ReportsWidgetGridProps {
  data: ReportsComputedData
  canViewFinancials?: boolean
}

function renderWidget(
  id: string,
  data: ReportsComputedData,
  canViewFinancials: boolean
) {
  switch (id) {
    case "core-metrics":
      return <ReportsCoreMetrics metrics={data.coreMetrics} />
    case "jobs-by-status":
      return (
        <JobsByStatusChart
          data={data.jobsByStatus}
          canViewFinancials={canViewFinancials}
        />
      )
    case "revenue-by-customer":
      if (!canViewFinancials) return null
      return <RevenueByCustomerChart data={data.revenueByCustomer} />
    case "pipeline":
      return (
        <PipelineChart
          data={data.pipelineByStage}
          totalPipeline={data.totalPipeline}
          bpaSharePct={data.bpaSharePct}
        />
      )
    case "delivery-schedule":
      return (
        <DeliveryScheduleCard
          data={data.deliverySchedule}
          canViewFinancials={canViewFinancials}
        />
      )
    case "summary":
      return <ReportsSummaryCard metrics={data.metrics} />
    case "pull-reasons":
      return <PullReasonsChart data={data.pullReasons} />
    default:
      return null
  }
}

export function ReportsWidgetGrid({
  data,
  canViewFinancials = false,
}: ReportsWidgetGridProps) {
  const chartWidgets = REPORTS_WIDGETS.filter((w) => w.id !== "core-metrics")
  const statusRevenueIds = canViewFinancials
    ? ["jobs-by-status", "revenue-by-customer"]
    : ["jobs-by-status"]

  return (
    <div className="space-y-6">
      {REPORTS_WIDGETS.filter((w) => w.id === "core-metrics").map((widget) => (
        <div key={widget.id}>
          {renderWidget(widget.id, data, canViewFinancials)}
        </div>
      ))}

      <div
        className={cn(
          "grid gap-6",
          canViewFinancials ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"
        )}
      >
        {chartWidgets
          .filter((w) => statusRevenueIds.includes(w.id))
          .map((widget) => (
            <div key={widget.id} className={spanClassName(widget.defaultSpan)}>
              {renderWidget(widget.id, data, canViewFinancials)}
            </div>
          ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {renderWidget("pipeline", data, canViewFinancials)}
        </div>
        <div className="space-y-6">
          {renderWidget("delivery-schedule", data, canViewFinancials)}
          {renderWidget("summary", data, canViewFinancials)}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {renderWidget("pull-reasons", data, canViewFinancials)}
      </div>
    </div>
  )
}
