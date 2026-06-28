"use client"

import { memo } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCompact } from "@/lib/dashboard-stats"

export interface PipelineStageData {
  stage: string
  count: number
  value: number
  bpaCount: number
  bpaValue: number
}

interface PipelineChartProps {
  data: PipelineStageData[]
  totalPipeline: number
  bpaSharePct: number
}

const STAGE_COLORS = [
  "oklch(0.55 0.04 255)",   // Prospecting - slate/navy
  "oklch(0.55 0.12 250)",   // Qualification - blue
  "oklch(0.60 0.14 230)",   // Estimating - sky
  "oklch(0.58 0.16 300)",   // Proposal - purple
  "oklch(0.68 0.19 44)",    // Negotiation - safety orange
]

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: PipelineStageData }>
}) {
  if (!active || !payload?.[0]) return null
  const item = payload[0].payload
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{item.stage}</p>
      <p className="text-muted-foreground mt-0.5">
        {item.count} opp{item.count !== 1 ? "s" : ""} · {formatCompact(item.value)}
      </p>
      {item.bpaCount > 0 && (
        <p className="text-[var(--orange)] mt-0.5 font-medium">
          BPA: {item.bpaCount} · {formatCompact(item.bpaValue)}
        </p>
      )}
    </div>
  )
}

export const PipelineChart = memo(function PipelineChart({
  data,
  totalPipeline,
  bpaSharePct,
}: PipelineChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: d.stage.slice(0, 4),
    valueM: Math.round(d.value / 10_000) / 100,
  }))

  return (
    <Card className="border shadow-sm h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Pipeline Summary</CardTitle>
            <CardDescription className="text-xs">
              Active opportunities by stage
            </CardDescription>
          </div>
          <Link href="/opportunities">
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
              View all <ArrowRight className="size-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                className="stroke-border/60"
              />
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
                tickFormatter={(v) => `$${v}M`}
                width={44}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
              <Bar dataKey="valueM" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {chartData.map((_, index) => (
                  <Cell key={index} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          {data.map((stage, i) => (
            <div key={stage.stage} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ background: STAGE_COLORS[i] }}
                />
                <span className="font-medium truncate">{stage.stage}</span>
                <Badge variant="secondary" className="text-[10px] px-1 py-0 shrink-0">
                  {stage.count}
                </Badge>
              </div>
              <span className="text-muted-foreground font-medium tabular-nums shrink-0 ml-2">
                {formatCompact(stage.value)}
              </span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Total Pipeline
            </p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {formatCompact(totalPipeline)}
            </p>
          </div>
          <Badge className="bg-[var(--navy)] text-white border-0 text-xs">
            BPA {bpaSharePct}% of pipeline
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
})
