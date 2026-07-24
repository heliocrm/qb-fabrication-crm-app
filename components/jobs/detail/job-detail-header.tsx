import Link from "next/link"
import {
  ArrowLeft,
  ChevronRight,
  Edit,
  MoreHorizontal,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { JobStatusBadge, PriorityBadge } from "@/components/status-badge"
import type { Job } from "@/types"

interface JobDetailHeaderProps {
  job: Job
}

export function JobDetailHeader({ job }: JobDetailHeaderProps) {
  return (
    <div className="border-b bg-card px-4 sm:px-6 py-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <Link href="/jobs" className="hover:text-foreground transition-colors">
          Jobs
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground font-medium">{job.jobNumber}</span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
            {job.description}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <JobStatusBadge status={job.status} />
            <PriorityBadge priority={job.priority} />
            <span className="text-xs font-mono font-semibold text-[var(--orange)] bg-[var(--orange-muted)] dark:bg-[var(--orange)]/10 px-2 py-0.5 rounded">
              {job.poNumber}
            </span>
            <span className="text-muted-foreground hidden sm:inline">·</span>
            <span className="text-xs text-muted-foreground">{job.customer}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link href={`/traveler/jobs/${job.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 min-h-10 touch-manipulation"
            >
              Traveler
            </Button>
          </Link>
          <Link href="/jobs">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="size-4" data-icon="inline-start" />
              Back
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Edit className="size-4" data-icon="inline-start" />
            Edit
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0"
          >
            <Plus className="size-4" data-icon="inline-start" />
            Add Task
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="More actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
