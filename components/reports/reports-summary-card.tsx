"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCompact } from "@/lib/reports-stats"
import type { ReportsMetrics } from "@/lib/reports-stats"

export function ReportsSummaryCard({ metrics }: { metrics: ReportsMetrics }) {
  const rows = [
    { label: "Total Tonnage", value: `${metrics.totalTonnage.toLocaleString()} T` },
    { label: "Open Jobs", value: String(metrics.openJobsCount) },
    { label: "Delivered Jobs", value: String(metrics.deliveredCount) },
    { label: "Active Opportunities", value: String(metrics.activeOppsCount) },
    { label: "Pipeline (raw)", value: formatCompact(metrics.pipelineValue) },
    { label: "Pipeline (weighted)", value: formatCompact(metrics.weightedPipeline) },
  ]

  return (
    <Card className="border shadow-sm h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Shop Summary</CardTitle>
        <CardDescription className="text-xs">
          Key operational metrics at a glance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-semibold tabular-nums">{row.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
