import type { Job, JobStatus, LineItemWipStatus } from "@/types"
import { LINE_ITEM_WIP_STATUSES } from "@/lib/job-detail-config"

export const JOB_STATUSES: JobStatus[] = [
  "To Do",
  "In Progress",
  "QC",
  "Shipping",
  "Delivered",
]

export interface ReportsFilters {
  dateFrom: string | null
  dateTo: string | null
  customerId: string
  jobStatus: string
  lineItemStatus: string
}

export const DEFAULT_REPORTS_FILTERS: ReportsFilters = {
  dateFrom: null,
  dateTo: null,
  customerId: "",
  jobStatus: "",
  lineItemStatus: "",
}

export type LineItemsByJob = Record<string, LineItemWipStatus[]>

export function countActiveReportsFilters(filters: ReportsFilters): number {
  let count = 0
  if (filters.dateFrom) count++
  if (filters.dateTo) count++
  if (filters.customerId) count++
  if (filters.jobStatus) count++
  if (filters.lineItemStatus) count++
  return count
}

export function serializeReportsFilters(filters: ReportsFilters): Record<string, string | null> {
  return { ...filters }
}

export function deserializeReportsFilters(
  raw: Record<string, unknown> | null | undefined
): ReportsFilters {
  if (!raw) return { ...DEFAULT_REPORTS_FILTERS }
  return {
    dateFrom: typeof raw.dateFrom === "string" ? raw.dateFrom : null,
    dateTo: typeof raw.dateTo === "string" ? raw.dateTo : null,
    customerId: typeof raw.customerId === "string" ? raw.customerId : "",
    jobStatus: typeof raw.jobStatus === "string" ? raw.jobStatus : "",
    lineItemStatus: typeof raw.lineItemStatus === "string" ? raw.lineItemStatus : "",
  }
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function jobMatchesDateRange(job: Job, dateFrom: string | null, dateTo: string | null): boolean {
  if (!dateFrom && !dateTo) return true
  const delivery = parseDate(job.deliveryDate)
  if (!delivery) return false

  const from = parseDate(dateFrom)
  const to = parseDate(dateTo)

  if (from && delivery < from) return false
  if (to) {
    const endOfDay = new Date(to)
    endOfDay.setHours(23, 59, 59, 999)
    if (delivery > endOfDay) return false
  }
  return true
}

export function filterReportsJobs(
  jobs: Job[],
  lineItemsByJob: LineItemsByJob,
  filters: ReportsFilters
): Job[] {
  return jobs.filter((job) => {
    if (!jobMatchesDateRange(job, filters.dateFrom, filters.dateTo)) return false

    if (filters.customerId) {
      const cid = job.customerId || job.accountId
      if (cid !== filters.customerId) return false
    }

    if (filters.jobStatus && job.status !== filters.jobStatus) return false

    if (filters.lineItemStatus) {
      const statuses = lineItemsByJob[job.id] ?? []
      if (!statuses.includes(filters.lineItemStatus as LineItemWipStatus)) return false
    }

    return true
  })
}

export { LINE_ITEM_WIP_STATUSES }
