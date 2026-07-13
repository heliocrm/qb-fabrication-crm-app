"use client"

import {
  Briefcase,
  CheckCircle2,
  Percent,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatCompact } from "@/lib/reports-stats"
import type { CoreReportsMetrics } from "@/lib/reports/metrics"

interface MetricCardProps {
  label: string
  value: string
  sub: string
  icon: LucideIcon
  accent: "navy" | "orange" | "green" | "blue"
}

const accentStyles = {
  navy: {
    icon: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  orange: {
    icon: "text-[var(--orange)]",
    bg: "bg-[var(--orange-muted)] dark:bg-[var(--orange)]/10",
  },
  green: {
    icon: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/40",
  },
  blue: {
    icon: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/40",
  },
}

function MetricCard({ label, value, sub, icon: Icon, accent }: MetricCardProps) {
  const styles = accentStyles[accent]
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              {label}
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1 tabular-nums">
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>
          </div>
          <div className={cn("p-2.5 rounded-lg shrink-0", styles.bg, styles.icon)}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ReportsCoreMetrics({ metrics }: { metrics: CoreReportsMetrics }) {
  const cards: MetricCardProps[] = [
    {
      label: "Total Jobs",
      value: String(metrics.totalJobs),
      sub: "In current filter set",
      icon: Briefcase,
      accent: "navy",
    },
    {
      label: "Pipeline Value",
      value: formatCompact(metrics.pipelineValue),
      sub: "Active opportunities",
      icon: TrendingUp,
      accent: "orange",
    },
    {
      label: "Completion",
      value: `${metrics.completionPct}%`,
      sub: "Avg job progress",
      icon: Percent,
      accent: "blue",
    },
    {
      label: "On-Time Delivery",
      value: `${metrics.onTimeDeliveryPct}%`,
      sub: "Delivered jobs on schedule",
      icon: CheckCircle2,
      accent: "green",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
  )
}
