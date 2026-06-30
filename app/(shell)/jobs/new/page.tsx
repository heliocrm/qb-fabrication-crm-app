import { redirect } from "next/navigation"
import { CreateJobForm } from "@/components/jobs/create-job-form"
import { canCreateJobs, getSessionContext } from "@/lib/auth/session"
import { loadCustomersData } from "@/lib/data/accounts"

export default async function NewJobPage() {
  const ctx = await getSessionContext()
  if (!ctx || !canCreateJobs(ctx.role)) {
    redirect("/jobs")
  }

  const { customers, source } = await loadCustomersData()

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Job</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Create a fabrication job from a Trello-style template with auto-seeded line items and checklists
        </p>
      </div>
      <CreateJobForm accounts={customers} dataSource={source} />
    </div>
  )
}
