import { MaterialRequestsList } from "@/components/material-requests/material-requests-list"
import { EnablePushCard } from "@/components/material-requests/enable-push-card"
import { getSessionContext } from "@/lib/auth/session"
import {
  loadMaterialPullRequests,
  loadMaterialPullSummary,
} from "@/lib/data/material-pull-requests"
import {
  MATERIAL_PULL_FUNNEL,
  MATERIAL_PULL_STATUS_LABELS,
} from "@/lib/material-pull-config"

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
        <p className="text-sm text-muted-foreground">{MATERIAL_PULL_FUNNEL}</p>
      </div>

      <EnablePushCard />

      {summary ? (
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <Stat label={MATERIAL_PULL_STATUS_LABELS.pending} value={summary.pending} />
          <Stat label={MATERIAL_PULL_STATUS_LABELS.approved} value={summary.approved} />
          <Stat label={MATERIAL_PULL_STATUS_LABELS.batched} value={summary.batched} />
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
    <div className="rounded-lg border bg-card px-2 py-3 text-center md:px-4 md:py-4">
      <p className="text-xl font-semibold tabular-nums md:text-2xl">{value}</p>
      <p className="text-[11px] text-muted-foreground md:text-xs">{label}</p>
    </div>
  )
}
