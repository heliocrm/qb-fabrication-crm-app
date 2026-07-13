"use client"

import Link from "next/link"
import { ExternalLink } from "lucide-react"
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
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job #</TableHead>
            <TableHead className="hidden sm:table-cell">Customer</TableHead>
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
                  <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {job.description}
                  </p>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-sm">
                {job.customer}
              </TableCell>
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
  )
}
