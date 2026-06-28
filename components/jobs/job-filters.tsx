"use client"

import { Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DEFAULT_JOB_FILTERS,
  JOB_PRIORITIES,
  JOB_STATUSES,
  countActiveFilters,
  type JobFilters,
} from "@/lib/jobs-config"
import { accounts } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface JobFiltersBarProps {
  filters: JobFilters
  onChange: (filters: JobFilters) => void
  resultCount: number
  totalCount: number
}

const selectClassName =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

export function JobFiltersBar({
  filters,
  onChange,
  resultCount,
  totalCount,
}: JobFiltersBarProps) {
  const activeCount = countActiveFilters(filters)

  function update(patch: Partial<JobFilters>) {
    onChange({ ...filters, ...patch })
  }

  function clearFilters() {
    onChange({ ...filters, ...DEFAULT_JOB_FILTERS, search: filters.search })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col lg:flex-row gap-3">
        <Input
          placeholder="Search job #, PO, customer, title…"
          className="h-9 lg:flex-1 lg:max-w-sm"
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
        />

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <Filter className="size-3.5" />
            <span className="font-medium hidden sm:inline">Filters</span>
          </div>

          <select
            aria-label="Filter by customer"
            className={cn(selectClassName, "min-w-[130px]")}
            value={filters.customerId}
            onChange={(e) => update({ customerId: e.target.value })}
          >
            <option value="">All customers</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.shortName} — {a.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by status"
            className={cn(selectClassName, "min-w-[120px]")}
            value={filters.status}
            onChange={(e) => update({ status: e.target.value })}
          >
            <option value="">All statuses</option>
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by urgency"
            className={cn(selectClassName, "min-w-[120px]")}
            value={filters.priority}
            onChange={(e) => update({ priority: e.target.value })}
          >
            <option value="">All urgency</option>
            {JOB_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
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
