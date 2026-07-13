"use client"

import { Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  countActiveReportsFilters,
  DEFAULT_REPORTS_FILTERS,
  JOB_STATUSES,
  LINE_ITEM_WIP_STATUSES,
  type ReportsFilters,
} from "@/lib/reports/filters"
import type { Account } from "@/types"
import { cn } from "@/lib/utils"

interface ReportsFilterBarProps {
  filters: ReportsFilters
  onChange: (filters: ReportsFilters) => void
  customers: Account[]
  resultCount: number
  totalCount: number
}

const selectClassName =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

export function ReportsFilterBar({
  filters,
  onChange,
  customers,
  resultCount,
  totalCount,
}: ReportsFilterBarProps) {
  const activeCount = countActiveReportsFilters(filters)

  function update(patch: Partial<ReportsFilters>) {
    onChange({ ...filters, ...patch })
  }

  function clearFilters() {
    onChange({ ...DEFAULT_REPORTS_FILTERS })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col xl:flex-row gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <Filter className="size-3.5" />
            <span className="font-medium hidden sm:inline">Filters</span>
          </div>

          <Input
            type="date"
            aria-label="From date"
            className="h-9 w-[140px]"
            value={filters.dateFrom ?? ""}
            onChange={(e) => update({ dateFrom: e.target.value || null })}
          />
          <span className="text-xs text-muted-foreground hidden sm:inline">to</span>
          <Input
            type="date"
            aria-label="To date"
            className="h-9 w-[140px]"
            value={filters.dateTo ?? ""}
            onChange={(e) => update({ dateTo: e.target.value || null })}
          />

          <select
            aria-label="Filter by customer"
            className={cn(selectClassName, "min-w-[130px]")}
            value={filters.customerId}
            onChange={(e) => update({ customerId: e.target.value })}
          >
            <option value="">All customers</option>
            {customers.map((a) => (
              <option key={a.id} value={a.id}>
                {a.shortName} — {a.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by job status"
            className={cn(selectClassName, "min-w-[120px]")}
            value={filters.jobStatus}
            onChange={(e) => update({ jobStatus: e.target.value })}
          >
            <option value="">All job statuses</option>
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by line item status"
            className={cn(selectClassName, "min-w-[140px]")}
            value={filters.lineItemStatus}
            onChange={(e) => update({ lineItemStatus: e.target.value })}
          >
            <option value="">All line item statuses</option>
            {LINE_ITEM_WIP_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {activeCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 gap-1 text-xs text-muted-foreground"
              onClick={clearFilters}
            >
              <X className="size-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          Showing <strong className="text-foreground">{resultCount}</strong> of{" "}
          {totalCount} jobs
        </span>
        {activeCount > 0 && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {activeCount} filter{activeCount !== 1 ? "s" : ""} active
          </Badge>
        )}
      </div>
    </div>
  )
}
