import Link from "next/link"
import { Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PriorityBadge } from "@/components/status-badge"
import { getOpenJobs } from "@/lib/dashboard-stats"
import { isBpaAccount } from "@/lib/seed-ids"
import type { Job } from "@/types"

export function UpcomingDeliveries({ jobs }: { jobs: Job[] }) {
  const upcoming = getOpenJobs(jobs)
    .sort(
      (a, b) =>
        new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()
    )
    .slice(0, 4)

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="size-4 text-[var(--orange)]" />
          Upcoming Deliveries
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {upcoming.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`}>
            <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center justify-center size-10 rounded-md bg-muted shrink-0 border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  {new Date(job.deliveryDate).toLocaleDateString("en-US", {
                    month: "short",
                  })}
                </span>
                <span className="text-sm font-bold text-foreground leading-none">
                  {new Date(job.deliveryDate).getDate()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold truncate">{job.jobNumber}</span>
                  {isBpaAccount(job.customerId) && (
                    <Badge className="text-[8px] px-1 py-0 bg-[var(--navy)] text-white border-0 shrink-0">
                      BPA
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{job.poNumber}</p>
              </div>
              <PriorityBadge priority={job.priority} />
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
