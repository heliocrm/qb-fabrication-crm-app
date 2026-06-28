import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  getDashboardMetrics,
  formatCompact,
} from "@/lib/dashboard-stats"
import type { Job, Opportunity } from "@/types"

interface MetricCardProps {
  label: string
  value: string
  sub: string
  icon: LucideIcon
  accent: "navy" | "orange" | "red" | "green"
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
  red: {
    icon: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
  },
  green: {
    icon: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/40",
  },
}

function MetricCard({ label, value, sub, icon: Icon, accent }: MetricCardProps) {
  const styles = accentStyles[accent]
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              {label}
            </p>
            <p className="text-3xl font-bold text-foreground mt-1.5 tabular-nums">
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

export function DashboardMetricCards({
  jobs,
  opportunities,
}: {
  jobs: Job[]
  opportunities: Opportunity[]
}) {
  const metrics = getDashboardMetrics(jobs, opportunities)

  const cards: MetricCardProps[] = [
    {
      label: "Open Jobs",
      value: String(metrics.openJobs.value),
      sub: metrics.openJobs.sub,
      icon: Briefcase,
      accent: "navy",
    },
    {
      label: "Pipeline Value",
      value: formatCompact(metrics.pipelineValue.value),
      sub: metrics.pipelineValue.sub,
      icon: TrendingUp,
      accent: "orange",
    },
    {
      label: "Urgent Jobs",
      value: String(metrics.urgentJobs.value),
      sub: metrics.urgentJobs.sub,
      icon: AlertTriangle,
      accent: "red",
    },
    {
      label: "On-Time %",
      value: `${metrics.onTimePct.value}%`,
      sub: metrics.onTimePct.sub,
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
