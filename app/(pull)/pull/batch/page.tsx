import { redirect } from "next/navigation"
import { MaterialBatchClient } from "@/components/material-requests/material-batch-client"
import {
  canManageMaterialRequests,
  getSessionContext,
} from "@/lib/auth/session"
import { loadMaterialPullRequests } from "@/lib/data/material-pull-requests"

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
  if (!canManageMaterialRequests(role)) {
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
        initialBatchId={params.batch}
      />
    </div>
  )
}
