"use client"

import { Plus, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatJobCurrency, formatJobDate } from "@/lib/job-detail-config"
import { cn } from "@/lib/utils"
import type { ChangeOrder, Job } from "@/types"

interface JobChangeOrdersTabProps {
  job: Job
  canWrite?: boolean
  canViewFinancials?: boolean
  onLogIssue?: () => void
}

const typeStyles: Record<string, string> = {
  "Change Order": "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
  NCR: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300",
  Issue: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300",
}

const statusStyles: Record<string, string> = {
  "Pending Approval": "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
  Resolved: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300",
  Open: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300",
}

export function JobChangeOrdersTab({
  job,
  canWrite = false,
  canViewFinancials = false,
  onLogIssue,
}: JobChangeOrdersTabProps) {
  const changeOrders = job.changeOrders
  const columns = canViewFinancials
    ? ["Date", "Type", "Description", "Impact", "Value", "Status"]
    : ["Date", "Type", "Description", "Impact", "Status"]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            {changeOrders.length} change order{changeOrders.length !== 1 ? "s" : ""} / issue
            {changeOrders.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Track BPA Rev D markups, NCRs, and field issues
          </p>
        </div>
        {canWrite ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 w-fit"
            onClick={onLogIssue}
          >
            <Plus className="size-4" data-icon="inline-start" />
            Log Issue
          </Button>
        ) : null}
      </div>

      {changeOrders.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="size-10 text-green-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No change orders or issues</p>
            <p className="text-xs text-muted-foreground mt-1">
              All work proceeding per original PO scope
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {columns.map((h, idx) => (
                    <th
                      key={h}
                      className={cn(
                        "text-left font-medium text-muted-foreground px-4 py-3 text-xs whitespace-nowrap",
                        idx === 0 && "pl-5",
                        idx === columns.length - 1 && "pr-5",
                        h === "Value" && "hidden md:table-cell"
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {changeOrders.map((co: ChangeOrder, i) => (
                  <tr
                    key={co.id}
                    className={cn(
                      "border-b last:border-0",
                      i % 2 === 1 && "bg-muted/20"
                    )}
                  >
                    <td className="px-4 py-3 pl-5 whitespace-nowrap text-muted-foreground">
                      {formatJobDate(co.date)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", typeStyles[co.type])}
                      >
                        {co.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate">{co.description}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[10rem]">
                      <p className="truncate">{co.impact || "—"}</p>
                    </td>
                    {canViewFinancials ? (
                      <td className="px-4 py-3 hidden md:table-cell tabular-nums">
                        {co.value != null ? formatJobCurrency(co.value) : "—"}
                      </td>
                    ) : null}
                    <td className="px-4 py-3 pr-5">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", statusStyles[co.status])}
                      >
                        {co.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
