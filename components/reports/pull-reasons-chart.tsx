"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PullReasonDatum } from "@/lib/reports/metrics"

interface PullReasonsChartProps {
  data: PullReasonDatum[]
}

export function PullReasonsChart({ data }: PullReasonsChartProps) {
  const max = Math.max(...data.map((d) => d.count), 1)
  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <Card className="border shadow-sm h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Material pull reasons</CardTitle>
        <p className="text-xs text-muted-foreground">
          {total} request{total !== 1 ? "s" : ""} (excluding cancelled)
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No material pull requests yet
          </p>
        ) : (
          data.map((row) => (
            <div key={row.reasonCode} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{row.label}</span>
                <span className="tabular-nums font-medium shrink-0">{row.count}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--orange)]"
                  style={{ width: `${Math.round((row.count / max) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
