"use client"

import Link from "next/link"
import {
  Briefcase,
  DollarSign,
  MapPin,
  Pencil,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { JobStatusBadge, PriorityBadge } from "@/components/status-badge"
import { CustomerContactsPanel } from "@/components/customers/customer-contacts-panel"
import { QbLinkChip } from "@/components/crm/qb-link-chip"
import { formatCompact } from "@/lib/dashboard-stats"
import { formatDeliveryDate } from "@/lib/jobs-config"
import { formatCurrency, cn } from "@/lib/utils"
import type { Customer360 } from "@/lib/data/accounts"

interface CustomerDetailViewProps {
  customer: Customer360
  className?: string
  canEdit?: boolean
  onEdit?: () => void
}

function StatBlock({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-center">
      <Icon className="size-4 mx-auto text-muted-foreground mb-1" />
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
    </div>
  )
}

export function CustomerDetailView({
  customer,
  className,
  canEdit,
  onEdit,
}: CustomerDetailViewProps) {
  const activeJobs = customer.jobs.filter((j) => j.status !== "Delivered")
  const pipelineValue = customer.opportunities
    .filter((o) => o.stage !== "Won" && o.stage !== "Lost")
    .reduce((s, o) => s + o.value, 0)

  return (
    <div className={cn("space-y-5", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex size-12 items-center justify-center rounded-lg bg-[var(--navy)] shrink-0">
            <span className="text-sm font-bold text-white">
              {customer.shortName.slice(0, 3)}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground leading-snug">
              {customer.name}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <MapPin className="size-3.5 shrink-0" />
              <span>
                {customer.city}, {customer.state}
              </span>
            </div>
            <QbLinkChip
              className="mt-2"
              url={customer.qbCustomerUrl}
              customerId={customer.qbCustomerId}
              statusNote={customer.qbStatusNote}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canEdit ? (
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="size-4" data-icon="inline-start" />
              Edit
            </Button>
          ) : null}
          <Badge
            className={cn(
              "w-fit text-xs border",
              customer.status === "Active"
                ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800"
                : "bg-secondary text-muted-foreground"
            )}
          >
            {customer.status}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBlock label="All Jobs" value={String(customer.totalJobs)} icon={Briefcase} />
        <StatBlock label="Active" value={String(customer.activeJobs)} icon={TrendingUp} />
        <StatBlock label="Total Value" value={formatCompact(customer.totalValue)} icon={DollarSign} />
        <StatBlock label="YTD" value={formatCompact(customer.ytdValue)} icon={DollarSign} />
      </div>

      {pipelineValue > 0 && (
        <div className="rounded-lg border bg-[var(--orange-muted)]/50 dark:bg-[var(--orange)]/10 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Open Pipeline
            </p>
            <p className="text-lg font-bold tabular-nums">{formatCompact(pipelineValue)}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {customer.opportunities.filter((o) => o.stage !== "Won" && o.stage !== "Lost").length}{" "}
            opps
          </Badge>
        </div>
      )}

      <CustomerContactsPanel accountId={customer.id} canWrite={Boolean(canEdit)} />

      <Separator />

      {/* Job history */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Job History</h3>
          <span className="text-xs text-muted-foreground">
            {activeJobs.length} active · {customer.jobs.length} total
          </span>
        </div>

        {customer.jobs.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No jobs on record for this account.
            </CardContent>
          </Card>
        ) : (
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["PO / Job", "Description", "Status", "Delivery", "Value"].map(
                      (h, idx) => (
                        <th
                          key={h}
                          className={cn(
                            "text-left font-medium text-muted-foreground px-4 py-2.5 text-xs whitespace-nowrap",
                            idx === 0 && "pl-5",
                            idx === 4 && "pr-5",
                            idx >= 3 && "hidden sm:table-cell"
                          )}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {customer.jobs.map((job, i) => (
                    <tr
                      key={job.id}
                      className={cn(
                        "border-b last:border-0 hover:bg-muted/30 transition-colors",
                        i % 2 !== 0 && "bg-muted/10"
                      )}
                    >
                      <td className="px-5 py-2.5 whitespace-nowrap">
                        <Link href={`/jobs/${job.id}`} className="group block hover:underline">
                          <p className="text-xs font-bold">{job.poNumber}</p>
                          <p className="text-[10px] text-muted-foreground">{job.jobNumber}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 max-w-[200px]">
                        <p className="text-xs line-clamp-2">{job.description}</p>
                        <div className="flex items-center gap-1 mt-1 sm:hidden">
                          <JobStatusBadge status={job.status} />
                          <PriorityBadge priority={job.priority} />
                        </div>
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        <div className="flex items-center gap-1">
                          <JobStatusBadge status={job.status} />
                          <PriorityBadge priority={job.priority} />
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                        {job.deliveryDate ? formatDeliveryDate(job.deliveryDate) : "—"}
                      </td>
                      <td className="px-5 py-2.5 text-xs font-semibold tabular-nums whitespace-nowrap">
                        {formatCurrency(job.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Opportunities */}
      {customer.opportunities.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Opportunities</h3>
          <div className="space-y-2">
            {customer.opportunities.map((opp) => (
              <Link
                key={opp.id}
                href={`/opportunities/${opp.id}`}
                className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{opp.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {opp.stage} · {opp.probability}% · closes{" "}
                    {opp.closeDate
                      ? new Date(opp.closeDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "TBD"}
                  </p>
                </div>
                <p className="text-sm font-bold tabular-nums shrink-0">
                  {formatCompact(opp.value)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
