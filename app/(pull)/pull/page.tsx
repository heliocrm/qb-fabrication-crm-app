import { MaterialRequestsList } from "@/components/material-requests/material-requests-list"
import { EnablePushCard } from "@/components/material-requests/enable-push-card"
import { getSessionContext } from "@/lib/auth/session"
import {
  loadMaterialPullRequests,
  loadMaterialPullSummary,
} from "@/lib/data/material-pull-requests"

export const metadata = {
  title: "Material Pull",
}

export default async function PullHomePage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>
}) {
  const params = await searchParams
  const ctx = await getSessionContext()
  const [{ requests }, summary] = await Promise.all([
    loadMaterialPullRequests({ status: "all" }),
    loadMaterialPullSummary(),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">All requests</h1>
        <p className="text-sm text-muted-foreground">
          Foremen submit · Eric sources · Tristan batches &amp; pulls
        </p>
      </div>

      <EnablePushCard />

      {summary ? (
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Pending" value={summary.pending} />
          <Stat label="Sourced" value={summary.sourced} />
          <Stat label="Batched" value={summary.batched} />
        </div>
      ) : null}

      <MaterialRequestsList
        initialRequests={requests}
        role={ctx?.role ?? "viewer"}
        highlightId={params.highlight}
        basePath="/pull"
      />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-2 py-2 text-center">
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}
