import { redirect } from "next/navigation"
import { MaterialRequestForm } from "@/components/material-requests/material-request-form"
import {
  canCreateMaterialRequests,
  getSessionContext,
} from "@/lib/auth/session"
import { MATERIAL_PULL_FUNNEL } from "@/lib/material-pull-config"
import { DEFAULT_MATERIAL_PULL_CAPABILITIES } from "@/types/Profile"

export const metadata = {
  title: "New Pull Request",
}

export default async function PullNewPage() {
  const ctx = await getSessionContext()
  const role = ctx?.role ?? "viewer"
  const caps = ctx?.materialPullCapabilities ?? DEFAULT_MATERIAL_PULL_CAPABILITIES
  if (!canCreateMaterialRequests(role, caps)) {
    redirect("/pull")
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">New request</h1>
        <p className="text-sm text-muted-foreground">
          Takes under a minute. Enters the Approval queue. {MATERIAL_PULL_FUNNEL}
        </p>
      </div>
      <MaterialRequestForm redirectTo="/pull" compact />
    </div>
  )
}
