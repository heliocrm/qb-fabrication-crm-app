import { Badge } from "@/components/ui/badge"
import { JobCard } from "@/components/job-card"
import { JOB_STATUSES, statusColors } from "@/lib/jobs-config"
import { formatCurrency } from "@/lib/utils"
import type { Job } from "@/types"

interface JobKanbanProps {
  jobs: Job[]
}

export function JobKanban({ jobs }: JobKanbanProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory scroll-smooth">
      {JOB_STATUSES.map((status) => {
        const colJobs = jobs.filter((j) => j.status === status)
        const colValue = colJobs.reduce((sum, j) => sum + j.value, 0)

        return (
          <div key={status} className="flex flex-col gap-2 min-w-[15rem] w-[15rem] sm:min-w-64 sm:w-64 shrink-0 snap-start">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{status}</span>
                <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                  {colJobs.length}
                </Badge>
              </div>
              {colValue > 0 && (
                <span className="text-xs text-muted-foreground font-medium tabular-nums">
                  {formatCurrency(colValue)}
                </span>
              )}
            </div>

            <div
              className={`flex flex-col gap-2.5 rounded-xl p-2.5 border-t-4 min-h-32 bg-muted/30 ${statusColors[status]}`}
            >
              {colJobs.map((job) => (
                <JobCard key={job.id} job={job} showStatus={false} />
              ))}
              {colJobs.length === 0 && (
                <div className="flex items-center justify-center min-h-20 text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  No jobs
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
