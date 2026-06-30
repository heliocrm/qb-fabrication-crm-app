import { isSupabaseConfigured } from "@/lib/supabase/env"
import { listJobs, getJobById } from "@/lib/supabase/services/jobs"
import { jobs as mockJobs } from "@/lib/mock-data"
import { filterJobs, type JobFilters } from "@/lib/jobs-config"
import { resolveAccountId, resolveJobId } from "@/lib/seed-ids"
import type { Job, JobListItem } from "@/types"

function listItemToJob(item: JobListItem): Job {
  return {
    id: item.id,
    jobNumber: item.jobNumber,
    poNumber: item.poNumber,
    customer: item.customer,
    customerId: item.customerId,
    accountId: item.accountId,
    description: item.description,
    status: item.status,
    priority: item.priority,
    deliveryDate: item.deliveryDate,
    startDate: "",
    tonnage: item.tonnage,
    value: item.value,
    markNumbers: [],
    assignees: item.assignees,
    progress: item.progress,
    notes: "",
    lineItems: [],
    tasks: [],
    documents: [],
    changeOrders: [],
    activity: [],
  }
}

/** Load all jobs — Supabase first, mock fallback */
export async function loadJobs(filters?: JobFilters): Promise<{
  jobs: Job[]
  source: "supabase" | "mock"
}> {
  if (isSupabaseConfigured()) {
    try {
      const items = await listJobs({
        search: filters?.search,
        customerId: filters?.customerId
          ? resolveAccountId(filters.customerId)
          : undefined,
        status: filters?.status as Job["status"] | undefined,
        priority: filters?.priority as Job["priority"] | undefined,
      })
      if (items.length > 0) {
        return { jobs: items.map(listItemToJob), source: "supabase" }
      }
    } catch {
      // fall through to mock
    }
  }

  const mock = filters ? filterJobs(mockJobs, filters) : mockJobs
  return { jobs: mock, source: "mock" }
}

/** Load single job with relations — Supabase first, mock fallback */
export async function loadJobById(id: string): Promise<{
  job: Job | null
  source: "supabase" | "mock"
}> {
  const resolvedId = resolveJobId(id)

  if (isSupabaseConfigured()) {
    try {
      const job = await getJobById(resolvedId)
      if (job) return { job, source: "supabase" }
    } catch {
      // fall through
    }
  }

  const mock = mockJobs.find((j) => j.id === id || j.id === resolvedId) ?? null
  return { job: mock, source: "mock" }
}

/** Load jobs for dashboard (no client filters) */
export async function loadJobsForDashboard(): Promise<Job[]> {
  const { jobs } = await loadJobs()
  return jobs
}
