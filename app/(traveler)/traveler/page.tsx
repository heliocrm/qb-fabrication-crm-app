import { listJobs } from "@/lib/supabase/services/jobs"
import { TravelerJobPicker } from "@/components/travelers/traveler-job-picker"
import { jobs as mockJobs } from "@/lib/mock-data"
import { isSupabaseConfigured } from "@/lib/supabase/env"

export const metadata = {
  title: "Traveler",
}

export default async function TravelerHomePage() {
  let jobs = mockJobs.map((j) => ({
    id: j.id,
    jobNumber: j.jobNumber,
    poNumber: j.poNumber,
    description: j.description,
    status: j.status,
    priority: j.priority,
    deliveryDate: j.deliveryDate,
    customer: j.customer,
    customerId: j.customerId,
    progress: j.progress,
    value: j.value,
    tonnage: j.tonnage,
  }))

  if (isSupabaseConfigured()) {
    try {
      jobs = await listJobs({ limit: 80 })
    } catch {
      /* keep mock fallback */
    }
  }

  return <TravelerJobPicker jobs={jobs} />
}
