"use client"

import Link from "next/link"
import { ChevronRight, ExternalLink } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { JobStatusBadge, PriorityBadge } from "@/components/status-badge"
import { formatCompact } from "@/lib/reports-stats"
import type { JobListItem } from "@/types"

interface ProfileAssignedJobsProps {
  jobs: JobListItem[]
}

export function ProfileAssignedJobs({ jobs }: ProfileAssignedJobsProps) {
  if (jobs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No jobs assigned to you yet.
      </p>
    )
  }

  return (
    <>
      {/* Mobile: stacked cards */}
      <ul className="sm:hidden space-y-2">
        {jobs.map((job) => (
          <li key={job.id}>
            <Link
              href={`/jobs/${job.id}`}
              className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{job.jobNumber}</span>
                  <JobStatusBadge status={job.status} />
                </div>
                <p className="text-xs text-muted-foreground truncate">{job.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{job.customer}</span>
                  <span aria-hidden>·</span>
                  <span className="tabular-nums shrink-0">{formatCompact(job.value)}</span>
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden sm:block rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Priority</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{job.jobNumber}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                      {job.description}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{job.customer}</TableCell>
                <TableCell>
                  <JobStatusBadge status={job.status} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <PriorityBadge priority={job.priority} />
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {formatCompact(job.value)}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="inline-flex p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label={`Open ${job.jobNumber}`}
                  >
                    <ExternalLink className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
