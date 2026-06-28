import { notFound } from "next/navigation"
import { JobDetailClient } from "@/components/jobs/detail/job-detail-client"
import { loadJobById } from "@/lib/data/jobs"

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { job, source } = await loadJobById(id)

  if (!job) notFound()

  return <JobDetailClient job={job} dataSource={source} />
}
