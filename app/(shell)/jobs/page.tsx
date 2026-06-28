import { JobsPageClient } from "@/components/jobs/jobs-page-client"
import { loadJobs } from "@/lib/data/jobs"

export default async function JobsPage() {
  const { jobs, source } = await loadJobs()

  return <JobsPageClient initialJobs={jobs} dataSource={source} />
}
