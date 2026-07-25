import { notFound } from "next/navigation"
import { TravelerPrintView } from "@/components/travelers/traveler-print-view"
import { TravelerPrintActions } from "@/components/travelers/traveler-print-actions"
import { getSessionContext } from "@/lib/auth/session"
import { getJobById } from "@/lib/supabase/services/jobs"
import { getActiveTravelerByJobId } from "@/lib/supabase/services/travelers"

export const metadata = {
  title: "Print traveler",
}

export default async function TravelerPwaPrintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await getSessionContext()
  if (!ctx) notFound()

  const job = await getJobById(id)
  if (!job) notFound()

  const traveler = await getActiveTravelerByJobId(id)
  if (!traveler) notFound()

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <TravelerPrintActions backHref={`/traveler/jobs/${id}`} />
      <TravelerPrintView traveler={traveler} jobNumber={job.jobNumber} />
    </div>
  )
}
