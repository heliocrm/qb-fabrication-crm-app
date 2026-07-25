"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Grid3X3, List, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { JobFiltersBar } from "@/components/jobs/job-filters"
import { JobListTable } from "@/components/jobs/job-list-table"
import { JobKanban } from "@/components/jobs/job-kanban"
import { updateJobAction } from "@/lib/actions/jobs"
import { DEFAULT_JOB_FILTERS, filterJobs } from "@/lib/jobs-config"
import { toast } from "@/lib/toast"
import {
  JOBS_VIEW_KEY,
  readViewPref,
  writeViewPref,
  type JobsView,
} from "@/lib/view-prefs"
import type { Job, JobStatus } from "@/types"

interface JobsPageClientProps {
  initialJobs: Job[]
  dataSource?: "supabase" | "mock"
}

const JOB_VIEWS = ["table", "kanban"] as const

export function JobsPageClient({ initialJobs, dataSource }: JobsPageClientProps) {
  const [view, setView] = useState<JobsView>("table")
  const [hydrated, setHydrated] = useState(false)
  const [jobs, setJobs] = useState(initialJobs)
  const [filters, setFilters] = useState(DEFAULT_JOB_FILTERS)
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setJobs(initialJobs)
  }, [initialJobs])

  useEffect(() => {
    setView(readViewPref(JOBS_VIEW_KEY, JOB_VIEWS, "table"))
    setHydrated(true)
  }, [])

  function changeView(next: JobsView) {
    setView(next)
    writeViewPref(JOBS_VIEW_KEY, next)
  }

  const filtered = useMemo(
    () => filterJobs(jobs, filters),
    [jobs, filters]
  )

  const handleStatusChange = useCallback(
    (id: string, status: JobStatus) => {
      let snapshot: Job[] | null = null
      let jobNumber = ""

      setJobs((prev) => {
        const job = prev.find((j) => j.id === id)
        if (!job || job.status === status) return prev
        snapshot = prev
        jobNumber = job.jobNumber
        return prev.map((j) => (j.id === id ? { ...j, status } : j))
      })

      if (!snapshot) return

      setPendingIds((prev) => new Set(prev).add(id))

      if (dataSource !== "supabase") {
        setPendingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        toast.success(`Moved to ${status}`, jobNumber)
        return
      }

      void updateJobAction(id, { status }).then((result) => {
        setPendingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        if (result.error) {
          setJobs(snapshot!)
          toast.error("Could not update status", result.error)
          return
        }
        toast.success(`Moved to ${status}`, jobNumber)
      })
    },
    [dataSource]
  )

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {jobs.length} total jobs · BPA, PGE, and utility PO tracking
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
        totalCount={jobs.length}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            {view === "table" ? "Table view" : "Kanban view"}
            {view === "kanban" && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                Drag cards to change status
              </span>
            )}
          </p>
          <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/30">
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="icon"
              className="size-9 sm:size-7"
              onClick={() => changeView("table")}
              aria-label="Table view"
            >
              <List className="size-4" />
            </Button>
            <Button
              variant={view === "kanban" ? "secondary" : "ghost"}
              size="icon"
              className="size-9 sm:size-7"
              onClick={() => changeView("kanban")}
              aria-label="Kanban view"
            >
              <Grid3X3 className="size-4" />
            </Button>
          </div>
        </div>

        {!hydrated || view === "table" ? (
          <JobListTable jobs={filtered} />
        ) : (
          <JobKanban
            jobs={filtered}
            onStatusChange={handleStatusChange}
            pendingIds={pendingIds}
          />
        )}
      </div>
    </div>
  )
}
