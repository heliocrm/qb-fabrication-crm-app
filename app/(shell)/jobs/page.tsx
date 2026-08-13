import { JobsPageClient } from "@/components/jobs/jobs-page-client"
import {
  canViewJobFinancials,
  getSessionContext,
  isAdminRole,
} from "@/lib/auth/session"
import { loadJobs } from "@/lib/data/jobs"

export default async function JobsPage() {
  const [{ jobs, source }, ctx] = await Promise.all([
    loadJobs(),
    getSessionContext(),
  ])
  const role = ctx?.role ?? "member"
  const canBulkDelete = Boolean(ctx && isAdminRole(role))
  const canViewFinancials = canViewJobFinancials(role)

  return (
    <JobsPageClient
      initialJobs={jobs}
      dataSource={source}
      canBulkDelete={canBulkDelete}
      canViewFinancials={canViewFinancials}
    />
  )
}
