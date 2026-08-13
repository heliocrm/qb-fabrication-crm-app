"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { JobStatusBadge, PriorityBadge } from "@/components/status-badge"
import { formatDeliveryDate } from "@/lib/jobs-config"
import { formatCurrency, cn } from "@/lib/utils"
import type { Job } from "@/types"

interface JobListTableProps {
  jobs: Job[]
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  canViewFinancials?: boolean
}

export function JobListTable({
  jobs,
  selectable = false,
  selectedIds,
  onSelectionChange,
  canViewFinancials = false,
}: JobListTableProps) {
  const selected = selectedIds ?? new Set<string>()
  const allSelected = jobs.length > 0 && jobs.every((j) => selected.has(j.id))
  const someSelected = jobs.some((j) => selected.has(j.id))

  function toggleAll(checked: boolean) {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange(new Set(jobs.map((j) => j.id)))
    } else {
      onSelectionChange(new Set())
    }
  }

  function toggleOne(id: string, checked: boolean) {
    if (!onSelectionChange) return
    const next = new Set(selected)
    if (checked) next.add(id)
    else next.delete(id)
    onSelectionChange(next)
  }

  if (jobs.length === 0) {
    return (
      <Card className="border shadow-sm">
        <div className="py-16 text-center text-sm text-muted-foreground">
          No jobs match your search and filters.
        </div>
      </Card>
    )
  }

  const headers = [
    ...(selectable ? ["Select"] : []),
    "PO #",
    "Title",
    "Customer",
    "Status",
    "Urgency",
    "Delivery",
    ...(canViewFinancials ? ["Value"] : []),
  ]

  return (
    <Card className="border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {headers.map((h, idx) => (
                <th
                  key={h}
                  className={cn(
                    "text-left font-medium text-muted-foreground px-4 py-3 text-xs whitespace-nowrap",
                    idx === 0 && "pl-5",
                    idx === headers.length - 1 && "pr-5",
                    (h === "Urgency" || h === "Delivery") && "hidden md:table-cell",
                    h === "Select" && "w-10 px-3"
                  )}
                >
                  {h === "Select" ? (
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(value) => toggleAll(value === true)}
                      aria-label="Select all jobs"
                      // Visual hint when some (not all) rows are selected
                      data-state={
                        allSelected
                          ? "checked"
                          : someSelected
                            ? "indeterminate"
                            : "unchecked"
                      }
                    />
                  ) : (
                    h
                  )}
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
                  i % 2 !== 0 && "bg-muted/10",
                  selected.has(job.id) && "bg-[var(--orange-muted)]/40"
                )}
              >
                {selectable ? (
                  <td className="pl-5 pr-2 py-3">
                    <Checkbox
                      checked={selected.has(job.id)}
                      onCheckedChange={(value) =>
                        toggleOne(job.id, value === true)
                      }
                      aria-label={`Select job ${job.jobNumber}`}
                    />
                  </td>
                ) : null}
                <td className={cn("py-3 whitespace-nowrap", selectable ? "px-4" : "px-5")}>
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
                {canViewFinancials ? (
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <span className="text-xs font-semibold tabular-nums">
                      {formatCurrency(job.value)}
                    </span>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
