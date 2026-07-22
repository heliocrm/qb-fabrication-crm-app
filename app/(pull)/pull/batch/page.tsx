import { MaterialBatchClient } from "@/components/material-requests/material-batch-client"
import { getSessionContext } from "@/lib/auth/session"
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
  const { requests } = await loadMaterialPullRequests({ status: "all" })

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <h1 className="text-xl font-semibold">Batch / Pull list</h1>
        <p className="text-sm text-muted-foreground">
          Tristan: print this list, pull material, mark complete.
        </p>
      </div>
      <MaterialBatchClient
        requests={requests}
        role={ctx?.role ?? "viewer"}
        initialBatchId={params.batch}
      />
    </div>
  )
}
