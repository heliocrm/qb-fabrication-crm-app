"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCompact } from "@/lib/reports-stats"
import type { MonthlyDeliveryDatum } from "@/lib/reports-stats"

export function DeliveryScheduleCard({ data }: { data: MonthlyDeliveryDatum[] }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <Card className="border shadow-sm h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Delivery Schedule</CardTitle>
        <CardDescription className="text-xs">
          Open jobs by expected delivery month
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No upcoming deliveries scheduled.
          </p>
        ) : (
          data.map((item) => (
            <div key={item.month} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{item.month}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {item.count} job{item.count !== 1 ? "s" : ""}
                  </Badge>
                  <span className="text-muted-foreground tabular-nums font-medium">
                    {formatCompact(item.value)}
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--orange)] transition-all"
                  style={{ width: `${Math.round((item.value / maxValue) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
