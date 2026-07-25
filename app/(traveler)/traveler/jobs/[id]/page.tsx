import { notFound } from "next/navigation"
import { TravelerJobFlow } from "@/components/travelers/traveler-job-flow"
import { TravelerFloorPanel } from "@/components/travelers/traveler-floor-panel"
import { loadJobById } from "@/lib/data/jobs"
import { getActiveTravelerByJobId } from "@/lib/supabase/services/travelers"
import { isSupabaseConfigured } from "@/lib/supabase/env"

export const metadata = {
  title: "Traveler",
}

export default async function TravelerJobPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { job } = await loadJobById(id)
  if (!job) notFound()

  let hasActiveTraveler = false
  if (isSupabaseConfigured()) {
    try {
      const traveler = await getActiveTravelerByJobId(id)
      hasActiveTraveler = Boolean(traveler)
    } catch {
      hasActiveTraveler = false
    }
  }

  if (hasActiveTraveler) {
    return (
      <div className="space-y-8">
        <TravelerFloorPanel
          jobId={job.id}
          jobNumber={job.jobNumber}
          description={job.description}
        />
        <details className="rounded-lg border p-3">
          <summary className="text-sm font-medium cursor-pointer">
            Re-import work order
          </summary>
          <div className="pt-4">
            <TravelerJobFlow
              jobId={job.id}
              jobNumber={job.jobNumber}
              poNumber={job.poNumber}
              description={job.description}
            />
          </div>
        </details>
      </div>
    )
  }

  return (
    <TravelerJobFlow
      jobId={job.id}
      jobNumber={job.jobNumber}
      poNumber={job.poNumber}
      description={job.description}
    />
  )
}
