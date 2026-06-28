import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { jobs, opportunities } from "@/lib/mock-data"
import { JobStatusBadge, PriorityBadge } from "@/components/status-badge"

const metrics = [
  {
    label: "Open Jobs",
    value: "4",
    sub: "2 urgent / hot",
    icon: Briefcase,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Pipeline Value",
    value: "$5.2M",
    sub: "8 opportunities",
    icon: TrendingUp,
    color: "text-[var(--orange)]",
    bg: "bg-[var(--orange-muted)]",
  },
  {
    label: "Urgent Items",
    value: "3",
    sub: "1 delivery < 6 wks",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    label: "On-Time Delivery",
    value: "94%",
    sub: "Last 12 months",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
]

const pipelineStages = [
  { stage: "Prospecting", count: 1, value: 2_100_000, color: "bg-slate-400" },
  { stage: "Qualification", count: 1, value: 320_000, color: "bg-blue-400" },
  { stage: "Estimating", count: 2, value: 2_010_000, color: "bg-sky-500" },
  { stage: "Proposal", count: 1, value: 540_000, color: "bg-purple-500" },
  { stage: "Negotiation", count: 1, value: 180_000, color: "bg-amber-500" },
]
const maxVal = Math.max(...pipelineStages.map((s) => s.value))

function fmt(n: number) {
  return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`
}

export default function DashboardPage() {
  const recentJobs = jobs.slice(0, 5)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Good morning, Ivy. Here&apos;s your shop overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/opportunities/new">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="size-4" data-icon="inline-start" />
              New Opportunity
            </Button>
          </Link>
          <Link href="/jobs/new">
            <Button size="sm" className="gap-1.5 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0">
              <Plus className="size-4" data-icon="inline-start" />
              New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{m.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{m.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{m.sub}</p>
                </div>
                <div className={`${m.bg} ${m.color} p-2.5 rounded-lg`}>
                  <m.icon className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Jobs */}
        <div className="lg:col-span-2">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Recent Jobs</CardTitle>
                <Link href="/jobs">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                    View all <ArrowRight className="size-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5 text-xs">Job / PO</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5 text-xs">Customer</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5 text-xs hidden md:table-cell">Status</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5 text-xs hidden lg:table-cell">Delivery</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5 text-xs hidden lg:table-cell">Progress</th>
                      <th className="text-right font-medium text-muted-foreground px-4 py-2.5 text-xs">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentJobs.map((job, i) => (
                      <tr key={job.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-4 py-3">
                          <Link href={`/jobs/${job.id}`} className="hover:underline">
                            <div className="font-semibold text-xs">{job.jobNumber}</div>
                            <div className="text-xs text-muted-foreground">{job.poNumber}</div>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-medium">{job.customer.split(" ").slice(0, 2).join(" ")}</div>
                          <PriorityBadge priority={job.priority} />
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <JobStatusBadge status={job.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                          {new Date(job.deliveryDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <Progress value={job.progress} className="h-1.5 w-20" />
                            <span className="text-xs text-muted-foreground">{job.progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs font-semibold">{fmt(job.value)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Summary */}
        <div>
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Pipeline</CardTitle>
                <Link href="/opportunities">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                    View all <ArrowRight className="size-3" />
                  </Button>
                </Link>
              </div>
              <CardDescription className="text-xs">Active opportunities by stage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pipelineStages.map((s) => (
                <div key={s.stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-foreground">{s.stage}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">{s.count}</Badge>
                      <span className="text-muted-foreground font-medium">{fmt(s.value)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${s.color} rounded-full transition-all`}
                      style={{ width: `${(s.value / maxVal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}

              <Separator className="my-3" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Pipeline</span>
                <span className="text-lg font-bold text-foreground">$5.15M</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick upcoming */}
          <Card className="border shadow-sm mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="size-4 text-[var(--orange)]" />
                Upcoming Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {jobs.filter(j => j.status !== "Delivered").slice(0, 3).map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex flex-col items-center justify-center size-10 rounded-md bg-muted shrink-0">
                      <span className="text-xs font-bold text-foreground">
                        {new Date(job.deliveryDate).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-sm font-bold text-foreground leading-none">
                        {new Date(job.deliveryDate).getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{job.jobNumber}</div>
                      <div className="text-xs text-muted-foreground truncate">{job.customer.split(" ").slice(0, 3).join(" ")}</div>
                    </div>
                    <PriorityBadge priority={job.priority} />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
