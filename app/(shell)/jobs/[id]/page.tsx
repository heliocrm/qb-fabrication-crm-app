import { notFound } from "next/navigation"
import { JobDetailClient } from "@/components/jobs/detail/job-detail-client"
import {
  canManageAssignees,
  canWriteJobs,
  getSessionContext,
} from "@/lib/auth/session"
import { loadJobById } from "@/lib/data/jobs"

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { job, source } = await loadJobById(id)

  if (!job) notFound()

  const ctx = await getSessionContext()
  const role = ctx?.role ?? "member"
  const canWrite = canWriteJobs(role)
  const canManageTeam = canManageAssignees(role)

  return (
    <JobDetailClient
      job={job}
      dataSource={source}
      canWrite={canWrite}
      canManageAssignees={canManageTeam}
    />
  )
}
