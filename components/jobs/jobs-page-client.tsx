"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Grid3X3, List, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { JobFiltersBar } from "@/components/jobs/job-filters"
import { JobListTable } from "@/components/jobs/job-list-table"
import { JobKanban } from "@/components/jobs/job-kanban"
import { DEFAULT_JOB_FILTERS, filterJobs } from "@/lib/jobs-config"
import type { Job } from "@/types"

interface JobsPageClientProps {
  initialJobs: Job[]
  dataSource?: "supabase" | "mock"
}

export function JobsPageClient({ initialJobs, dataSource }: JobsPageClientProps) {
  const [view, setView] = useState<"table" | "kanban">("table")
  const [filters, setFilters] = useState(DEFAULT_JOB_FILTERS)

  const filtered = useMemo(
    () => filterJobs(initialJobs, filters),
    [initialJobs, filters]
  )

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {initialJobs.length} total jobs · BPA, PGE, and utility PO tracking
            {dataSource === "supabase" && (
              <span className="ml-1 text-[var(--orange)]">· live data</span>
            )}
          </p>
        </div>
        <Link href="/jobs/new">
          <Button
            size="sm"
            className="gap-1.5 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0 w-fit"
          >
            <Plus className="size-4" data-icon="inline-start" />
            New Job
          </Button>
        </Link>
      </div>

      <JobFiltersBar
        filters={filters}
        onChange={setFilters}
        resultCount={filtered.length}
        totalCount={initialJobs.length}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            {view === "table" ? "Table view" : "Kanban view"}
          </p>
          <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/30">
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="icon"
              className="size-9 sm:size-7"
              onClick={() => setView("table")}
              aria-label="Table view"
            >
              <List className="size-4" />
            </Button>
            <Button
              variant={view === "kanban" ? "secondary" : "ghost"}
              size="icon"
              className="size-9 sm:size-7"
              onClick={() => setView("kanban")}
              aria-label="Kanban view"
            >
              <Grid3X3 className="size-4" />
            </Button>
          </div>
        </div>

        {view === "table" ? (
          <JobListTable jobs={filtered} />
        ) : (
          <JobKanban jobs={filtered} />
        )}
      </div>
    </div>
  )
}
