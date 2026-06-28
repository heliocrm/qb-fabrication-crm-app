import Link from "next/link"
import { memo } from "react"
import { Calendar, Building2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { JobStatusBadge, PriorityBadge } from "@/components/status-badge"
import { formatDeliveryDate } from "@/lib/jobs-config"
import { cn } from "@/lib/utils"
import type { Job } from "@/types"

const BPA_ACCOUNT_ID = "c1"

interface JobCardProps {
  job: Job
  className?: string
  /** Show status badge on card (useful in kanban where column also shows stage) */
  showStatus?: boolean
}

export const JobCard = memo(function JobCard({ job, className, showStatus = true }: JobCardProps) {
  const isBpa = job.customerId === BPA_ACCOUNT_ID

  return (
    <Link href={`/jobs/${job.id}`}>
      <Card
        className={cn(
          "border shadow-sm hover:shadow-md transition-shadow cursor-pointer",
          className
        )}
      >
        <CardContent className="p-3 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                PO#
              </p>
              <p className="text-sm font-bold text-foreground truncate">{job.poNumber}</p>
            </div>
            {job.priority !== "Normal" && <PriorityBadge priority={job.priority} />}
          </div>

          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
              Title
            </p>
            <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">
              {job.description}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{job.jobNumber}</p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="size-3 shrink-0" />
            <span className="truncate flex-1">{job.customer}</span>
            {isBpa && (
              <Badge className="text-[8px] px-1 py-0 bg-[var(--navy)] text-white border-0 shrink-0">
                BPA
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3 shrink-0" />
              <span>{formatDeliveryDate(job.deliveryDate)}</span>
            </div>
            {showStatus && <JobStatusBadge status={job.status} />}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
})
