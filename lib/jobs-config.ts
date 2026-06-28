import type { JobStatus, Priority } from "@/types"

export const JOB_STATUSES: JobStatus[] = [
  "To Do",
  "In Progress",
  "QC",
  "Shipping",
  "Delivered",
]

export const JOB_PRIORITIES: Priority[] = ["Normal", "Hot", "Urgent"]

export const statusColors: Record<JobStatus, string> = {
  "To Do": "border-t-slate-400",
  "In Progress": "border-t-blue-500",
  QC: "border-t-purple-500",
  Shipping: "border-t-amber-500",
  Delivered: "border-t-green-500",
}

export interface JobFilters {
  search: string
  customerId: string
  status: string
  priority: string
}

export const DEFAULT_JOB_FILTERS: JobFilters = {
  search: "",
  customerId: "",
  status: "",
  priority: "",
}

export function formatDeliveryDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function filterJobs<
  T extends {
    jobNumber: string
    poNumber: string
    customer: string
    customerId: string
    description: string
    status: JobStatus
    priority: Priority
    markNumbers: string[]
  },
>(jobs: T[], filters: JobFilters): T[] {
  const q = filters.search.trim().toLowerCase()

  return jobs.filter((job) => {
    if (q) {
      const haystack = [
        job.jobNumber,
        job.poNumber,
        job.customer,
        job.description,
        ...job.markNumbers,
      ]
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    if (filters.customerId && job.customerId !== filters.customerId) return false
    if (filters.status && job.status !== filters.status) return false
    if (filters.priority && job.priority !== filters.priority) return false
    return true
  })
}

export function countActiveFilters(filters: JobFilters): number {
  let n = 0
  if (filters.customerId) n++
  if (filters.status) n++
  if (filters.priority) n++
  return n
}
