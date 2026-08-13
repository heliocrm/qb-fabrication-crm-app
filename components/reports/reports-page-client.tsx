"use client"

import { useMemo, useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReportsFilterBar } from "@/components/reports/reports-filter-bar"
import { ReportsSavedViews } from "@/components/reports/reports-saved-views"
import { ReportsWidgetGrid } from "@/components/reports/reports-widget-grid"
import {
  DEFAULT_REPORTS_FILTERS,
  filterReportsJobs,
  type ReportsFilters,
} from "@/lib/reports/filters"
import { computeReportsData } from "@/lib/reports/metrics"
import { downloadCsv, jobsToCsv, pullReasonsToCsv } from "@/lib/reports/export-csv"
import { toast } from "@/lib/toast"
import type { ReportsDataset } from "@/lib/data/reports"
import type { ReportView } from "@/types"

interface ReportsPageClientProps {
  initialData: ReportsDataset
  savedViews: ReportView[]
  canViewFinancials?: boolean
}

export function ReportsPageClient({
  initialData,
  savedViews,
  canViewFinancials = false,
}: ReportsPageClientProps) {
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
        initialData.customers,
        initialData.materialPullRequests
      ),
    [
      filteredJobs,
      initialData.opportunities,
      initialData.customers,
      initialData.materialPullRequests,
    ]
  )

  function handleExportJobs() {
    if (!filteredJobs.length) {
      toast.error("Nothing to export", "No jobs match the current filters.")
      return
    }
    const stamp = new Date().toISOString().slice(0, 10)
    downloadCsv(
      `jobs-report-${stamp}.csv`,
      jobsToCsv(filteredJobs, { includeValue: canViewFinancials })
    )
    toast.success("Export started", `${filteredJobs.length} jobs`)
  }

  function handleExportReasons() {
    if (!computed.pullReasons.length) {
      toast.error("Nothing to export", "No material pull reasons to export.")
      return
    }
    const stamp = new Date().toISOString().slice(0, 10)
    downloadCsv(
      `material-pull-reasons-${stamp}.csv`,
      pullReasonsToCsv(computed.pullReasons)
    )
    toast.success("Export started", "Pull reasons CSV")
  }

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
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleExportJobs}>
            <Download className="size-4" data-icon="inline-start" />
            Export jobs CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportReasons}
          >
            <Download className="size-4" data-icon="inline-start" />
            Export reasons CSV
          </Button>
          <ReportsSavedViews
            views={views}
            currentFilters={filters}
            onLoadView={setFilters}
            onViewsChange={setViews}
          />
        </div>
      </div>

      <ReportsFilterBar
        filters={filters}
        onChange={setFilters}
        customers={initialData.customers}
        resultCount={filteredJobs.length}
        totalCount={initialData.jobs.length}
      />

      <ReportsWidgetGrid data={computed} canViewFinancials={canViewFinancials} />
    </div>
  )
}
