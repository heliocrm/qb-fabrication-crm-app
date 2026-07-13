"use client"

import { useMemo, useState } from "react"
import { ReportsFilterBar } from "@/components/reports/reports-filter-bar"
import { ReportsSavedViews } from "@/components/reports/reports-saved-views"
import { ReportsWidgetGrid } from "@/components/reports/reports-widget-grid"
import {
  DEFAULT_REPORTS_FILTERS,
  filterReportsJobs,
  type ReportsFilters,
} from "@/lib/reports/filters"
import { computeReportsData } from "@/lib/reports/metrics"
import type { ReportsDataset } from "@/lib/data/reports"
import type { ReportView } from "@/types"

interface ReportsPageClientProps {
  initialData: ReportsDataset
  savedViews: ReportView[]
}

export function ReportsPageClient({ initialData, savedViews }: ReportsPageClientProps) {
  const [filters, setFilters] = useState<ReportsFilters>(DEFAULT_REPORTS_FILTERS)
  const [views, setViews] = useState(savedViews)

  const filteredJobs = useMemo(
    () => filterReportsJobs(initialData.jobs, initialData.lineItemsByJob, filters),
    [initialData.jobs, initialData.lineItemsByJob, filters]
  )

  const computed = useMemo(
    () =>
      computeReportsData(
        filteredJobs,
        initialData.opportunities,
        initialData.customers
      ),
    [filteredJobs, initialData.opportunities, initialData.customers]
  )

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Business intelligence — filter, analyze, and save your views
            {initialData.source === "supabase" && (
              <span className="ml-1 text-[var(--orange)]">· live data</span>
            )}
          </p>
        </div>
        <ReportsSavedViews
          views={views}
          currentFilters={filters}
          onLoadView={setFilters}
          onViewsChange={setViews}
        />
      </div>

      <ReportsFilterBar
        filters={filters}
        onChange={setFilters}
        customers={initialData.customers}
        resultCount={filteredJobs.length}
        totalCount={initialData.jobs.length}
      />

      <ReportsWidgetGrid data={computed} />
    </div>
  )
}
