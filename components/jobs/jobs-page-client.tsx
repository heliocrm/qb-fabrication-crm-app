"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Grid3X3, List, Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { JobFiltersBar } from "@/components/jobs/job-filters"
import { JobListTable } from "@/components/jobs/job-list-table"
import { JobKanban } from "@/components/jobs/job-kanban"
import { bulkDeleteJobsAction, updateJobAction } from "@/lib/actions/jobs"
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
  canBulkDelete?: boolean
  canViewFinancials?: boolean
}

const JOB_VIEWS = ["table", "kanban"] as const

export function JobsPageClient({
  initialJobs,
  dataSource,
  canBulkDelete = false,
  canViewFinancials = false,
}: JobsPageClientProps) {
  const router = useRouter()
  const [view, setView] = useState<JobsView>("table")
  const [hydrated, setHydrated] = useState(false)
  const [jobs, setJobs] = useState(initialJobs)
  const [filters, setFilters] = useState(DEFAULT_JOB_FILTERS)
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

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
    if (next !== "table") setSelectedIds(new Set())
  }

  const filtered = useMemo(
    () => filterJobs(jobs, filters),
    [jobs, filters]
  )

  useEffect(() => {
    const visible = new Set(filtered.map((j) => j.id))
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => visible.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [filtered])

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

  async function handleBulkDelete() {
    const ids = [...selectedIds]
    if (ids.length === 0) return

    const ok = window.confirm(
      `Delete ${ids.length} job${ids.length === 1 ? "" : "s"}? Linked Google Drive folders will be moved to trash. This cannot be undone.`
    )
    if (!ok) return

    setBulkDeleting(true)
    const result = await bulkDeleteJobsAction(ids)
    setBulkDeleting(false)

    if (result.error || !result.data) {
      toast.error("Bulk delete failed", result.error)
      return
    }

    const { deleted, driveFailed, failedIds } = result.data
    const failed = new Set(failedIds)
    setJobs((prev) => prev.filter((j) => failed.has(j.id) || !selectedIds.has(j.id)))
    setSelectedIds(new Set(failedIds))

    if (deleted > 0) {
      const driveNote =
        driveFailed > 0
          ? ` (${driveFailed} Drive folder${driveFailed === 1 ? "" : "s"} could not be trashed)`
          : ""
      toast.success(
        `Deleted ${deleted} job${deleted === 1 ? "" : "s"}`,
        failedIds.length > 0
          ? `${failedIds.length} failed.${driveNote}`
          : driveNote.replace(/^\s+/, "") || undefined
      )
    } else {
      toast.error("No jobs deleted", "Check permissions or try again.")
    }

    router.refresh()
  }

  const showBulkBar = canBulkDelete && view === "table" && selectedIds.size > 0

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
            {canBulkDelete && view === "table" && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                Select rows to bulk delete
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
          <JobListTable
            jobs={filtered}
            selectable={canBulkDelete}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            canViewFinancials={canViewFinancials}
          />
        ) : (
          <JobKanban
            jobs={filtered}
            onStatusChange={handleStatusChange}
            pendingIds={pendingIds}
            canViewFinancials={canViewFinancials}
          />
        )}
      </div>

      {showBulkBar ? (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 shadow-md">
          <p className="text-sm font-medium">
            {selectedIds.size} selected
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={bulkDeleting}
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="gap-1.5"
              disabled={bulkDeleting || dataSource !== "supabase"}
              onClick={() => void handleBulkDelete()}
            >
              {bulkDeleting ? (
                <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
              ) : (
                <Trash2 className="size-4" data-icon="inline-start" />
              )}
              Delete {selectedIds.size} job{selectedIds.size === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
