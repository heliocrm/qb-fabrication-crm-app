import Link from "next/link"
import { ArrowRight, Briefcase, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { JobStatusBadge, PriorityBadge } from "@/components/status-badge"
import { getRecentJobs, formatCompact } from "@/lib/dashboard-stats"
import { isBpaAccount } from "@/lib/seed-ids"
import type { Job } from "@/types"

export function RecentJobsTable({ jobs }: { jobs: Job[] }) {
  const recentJobs = getRecentJobs(jobs, 6)

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold">Recent Jobs</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              BPA-heavy workload · sorted by start date
            </p>
          </div>
          {recentJobs.length > 0 && (
            <Link href="/jobs" className="shrink-0">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                View all <ArrowRight className="size-3" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className={recentJobs.length === 0 ? "pb-6" : "p-0"}>
        {recentJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-4">
              <Briefcase className="size-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-foreground">No jobs yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Create your first job to track POs, fabrication progress, and deliveries.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-5 w-full sm:w-auto">
              <Link href="/jobs/new" className="w-full sm:w-auto">
                <Button
                  size="sm"
                  className="gap-1.5 w-full bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0"
                >
                  <Plus className="size-4" />
                  New Job
                </Button>
              </Link>
              <Link href="/jobs" className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="w-full">
                  Browse jobs
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Job / PO", "Customer", "Status", "Delivery", "Progress", "Value"].map(
                    (h, idx) => (
                      <th
                        key={h}
                        className={`text-left font-medium text-muted-foreground px-4 py-2.5 text-xs whitespace-nowrap first:pl-5 last:pr-5 ${idx === 2 ? "hidden md:table-cell" : ""} ${idx >= 3 && idx <= 4 ? "hidden lg:table-cell" : ""}`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job, i) => {
                  const isBpa = isBpaAccount(job.customerId)
                  return (
                    <tr
                      key={job.id}
                      className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 !== 0 ? "bg-muted/10" : ""}`}
                    >
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Link href={`/jobs/${job.id}`} className="group block hover:underline">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-foreground">
                              {job.jobNumber}
                            </span>
                            {isBpa && (
                              <Badge className="text-[9px] px-1 py-0 bg-[var(--navy)] text-white border-0">
                                BPA
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{job.poNumber}</div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium max-w-[140px] truncate">
                          {job.customer}
                        </div>
                        <PriorityBadge priority={job.priority} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell whitespace-nowrap">
                        <JobStatusBadge status={job.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                        {new Date(job.deliveryDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={job.progress} className="h-1.5 w-20" />
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {job.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <span className="text-xs font-semibold tabular-nums">
                          {formatCompact(job.value)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
