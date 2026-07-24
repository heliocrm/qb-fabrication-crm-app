import { redirect } from "next/navigation"
import { MaterialBatchClient } from "@/components/material-requests/material-batch-client"
import {
  canBatchMaterialRequests,
  getSessionContext,
} from "@/lib/auth/session"
import { loadMaterialPullRequests } from "@/lib/data/material-pull-requests"
import { DEFAULT_MATERIAL_PULL_CAPABILITIES } from "@/types/Profile"

export const metadata = {
  title: "Pull List",
}

export default async function PullBatchPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>
}) {
  const params = await searchParams
  const ctx = await getSessionContext()
  const role = ctx?.role ?? "viewer"
  const caps = ctx?.materialPullCapabilities ?? DEFAULT_MATERIAL_PULL_CAPABILITIES
  if (!canBatchMaterialRequests(role, caps)) {
    redirect("/pull")
  }

  const { requests } = await loadMaterialPullRequests({ status: "all" })

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <h1 className="text-xl font-semibold">Batch / Pull list</h1>
        <p className="text-sm text-muted-foreground">
          Print this list, pull material, complete the checklist, mark done.
        </p>
      </div>
      <MaterialBatchClient
        requests={requests}
        role={role}
        capabilities={caps}
        initialBatchId={params.batch}
      />
    </div>
  )
}
