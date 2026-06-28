import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { JobStatusBadge, PriorityBadge } from "@/components/status-badge"
import { formatDeliveryDate } from "@/lib/jobs-config"
import { formatCurrency, cn } from "@/lib/utils"
import type { Job } from "@/types"

interface JobListTableProps {
  jobs: Job[]
}

export function JobListTable({ jobs }: JobListTableProps) {
  if (jobs.length === 0) {
    return (
      <Card className="border shadow-sm">
        <div className="py-16 text-center text-sm text-muted-foreground">
          No jobs match your search and filters.
        </div>
      </Card>
    )
  }

  return (
    <Card className="border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {[
                "PO #",
                "Title",
                "Customer",
                "Status",
                "Urgency",
                "Delivery",
                "Value",
              ].map((h, idx) => (
                <th
                  key={h}
                  className={cn(
                    "text-left font-medium text-muted-foreground px-4 py-3 text-xs whitespace-nowrap",
                    idx === 0 && "pl-5",
                    idx === 6 && "pr-5",
                    idx >= 4 && idx <= 5 && "hidden md:table-cell"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, i) => (
              <tr
                key={job.id}
                className={cn(
                  "border-b last:border-0 hover:bg-muted/30 transition-colors",
                  i % 2 !== 0 && "bg-muted/10"
                )}
              >
                <td className="px-5 py-3 whitespace-nowrap">
                  <Link href={`/jobs/${job.id}`} className="group block hover:underline">
                    <p className="text-xs font-bold text-foreground">{job.poNumber}</p>
                    <p className="text-[10px] text-muted-foreground">{job.jobNumber}</p>
                  </Link>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="text-xs font-medium line-clamp-2">{job.description}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs max-w-[140px] truncate">{job.customer}</span>
                    {job.customerId === "c1" && (
                      <Badge className="text-[8px] px-1 py-0 bg-[var(--navy)] text-white border-0 shrink-0">
                        BPA
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <JobStatusBadge status={job.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                  <PriorityBadge priority={job.priority} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap hidden md:table-cell">
                  {formatDeliveryDate(job.deliveryDate)}
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  <span className="text-xs font-semibold tabular-nums">
                    {formatCurrency(job.value)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
