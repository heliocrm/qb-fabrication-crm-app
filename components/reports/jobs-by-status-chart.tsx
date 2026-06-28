"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCompact } from "@/lib/reports-stats"
import type { JobsByStatusDatum } from "@/lib/reports-stats"

const STATUS_COLORS: Record<string, string> = {
  "To Do": "oklch(0.55 0.04 255)",
  "In Progress": "oklch(0.68 0.19 44)",
  QC: "oklch(0.60 0.14 230)",
  Shipping: "oklch(0.58 0.16 300)",
  Delivered: "oklch(0.55 0.15 145)",
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: JobsByStatusDatum }>
}) {
  if (!active || !payload?.[0]) return null
  const item = payload[0].payload
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold">{item.status}</p>
      <p className="text-muted-foreground mt-0.5">
        {item.count} job{item.count !== 1 ? "s" : ""} · {formatCompact(item.value)}
      </p>
    </div>
  )
}

export function JobsByStatusChart({ data }: { data: JobsByStatusDatum[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: d.status === "In Progress" ? "Active" : d.status,
    valueK: Math.round(d.value / 100) / 10,
  }))

  return (
    <Card className="border shadow-sm h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Jobs by Status</CardTitle>
        <CardDescription className="text-xs">
          Workload distribution and value by stage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/60" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={32}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {chartData.map((d) => (
                  <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? "var(--muted-foreground)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1.5">
          {data.map((d) => (
            <div key={d.status} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ background: STATUS_COLORS[d.status] }}
                />
                <span className="font-medium">{d.status}</span>
              </div>
              <span className="text-muted-foreground tabular-nums">
                {d.count} · {formatCompact(d.value)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
