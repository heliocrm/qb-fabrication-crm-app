"use client"

import { ReportsCoreMetrics } from "@/components/reports/reports-core-metrics"
import { JobsByStatusChart } from "@/components/reports/jobs-by-status-chart"
import { RevenueByCustomerChart } from "@/components/reports/revenue-by-customer-chart"
import { DeliveryScheduleCard } from "@/components/reports/delivery-schedule-card"
import { ReportsSummaryCard } from "@/components/reports/reports-summary-card"
import { PipelineChart } from "@/components/dashboard/pipeline-chart"
import { REPORTS_WIDGETS, spanClassName } from "@/lib/reports/widgets"
import type { ReportsComputedData } from "@/lib/reports/metrics"

interface ReportsWidgetGridProps {
  data: ReportsComputedData
}

function renderWidget(id: string, data: ReportsComputedData) {
  switch (id) {
    case "core-metrics":
      return <ReportsCoreMetrics metrics={data.coreMetrics} />
    case "jobs-by-status":
      return <JobsByStatusChart data={data.jobsByStatus} />
    case "revenue-by-customer":
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
      return <DeliveryScheduleCard data={data.deliverySchedule} />
    case "summary":
      return <ReportsSummaryCard metrics={data.metrics} />
    default:
      return null
  }
}

export function ReportsWidgetGrid({ data }: ReportsWidgetGridProps) {
  const chartWidgets = REPORTS_WIDGETS.filter((w) => w.id !== "core-metrics")

  return (
    <div className="space-y-6">
      {REPORTS_WIDGETS.filter((w) => w.id === "core-metrics").map((widget) => (
        <div key={widget.id}>{renderWidget(widget.id, data)}</div>
      ))}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {chartWidgets
          .filter((w) => ["jobs-by-status", "revenue-by-customer"].includes(w.id))
          .map((widget) => (
            <div key={widget.id} className={spanClassName(widget.defaultSpan)}>
              {renderWidget(widget.id, data)}
            </div>
          ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {renderWidget("pipeline", data)}
        </div>
        <div className="space-y-6">
          {renderWidget("delivery-schedule", data)}
          {renderWidget("summary", data)}
        </div>
      </div>
    </div>
  )
}
