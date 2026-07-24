import { notFound } from "next/navigation"
import { TravelerJobFlow } from "@/components/travelers/traveler-job-flow"
import { loadJobById } from "@/lib/data/jobs"

export const metadata = {
  title: "Generate traveler",
}

export default async function TravelerJobPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { job } = await loadJobById(id)
  if (!job) notFound()

  return (
    <TravelerJobFlow
      jobId={job.id}
      jobNumber={job.jobNumber}
      poNumber={job.poNumber}
      description={job.description}
    />
  )
}
