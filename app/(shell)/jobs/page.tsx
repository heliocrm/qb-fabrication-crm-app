import { JobsPageClient } from "@/components/jobs/jobs-page-client"
import { getSessionContext, isAdminRole } from "@/lib/auth/session"
import { loadJobs } from "@/lib/data/jobs"

export default async function JobsPage() {
  const [{ jobs, source }, ctx] = await Promise.all([
    loadJobs(),
    getSessionContext(),
  ])
  const canBulkDelete = Boolean(ctx && isAdminRole(ctx.role))

  return (
    <JobsPageClient
      initialJobs={jobs}
      dataSource={source}
      canBulkDelete={canBulkDelete}
    />
  )
}
