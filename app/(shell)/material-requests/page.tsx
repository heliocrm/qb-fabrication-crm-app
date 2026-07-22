import Link from "next/link"
import { Package, Plus } from "lucide-react"
import { MaterialRequestsList } from "@/components/material-requests/material-requests-list"
import { Button } from "@/components/ui/button"
import { getSessionContext } from "@/lib/auth/session"
import {
  loadMaterialPullRequests,
  loadMaterialPullSummary,
} from "@/lib/data/material-pull-requests"

export const metadata = {
  title: "Material Requests",
}

export default async function MaterialRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>
}) {
  const params = await searchParams
  const ctx = await getSessionContext()
  const [{ requests, source }, summary] = await Promise.all([
    loadMaterialPullRequests({ status: "all" }),
    loadMaterialPullSummary(),
  ])

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Package className="size-6 text-[var(--orange)]" />
            Material Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Single funnel for floor pulls — request → Eric sources → Tristan batch/pull.
            {source === "empty" ? " Connect Supabase and run migration 010 to load data." : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link href="/material-requests/batch" />}>
            Batch / Pull list
          </Button>
          <Button render={<Link href="/material-requests/new" />}>
            <Plus className="size-4" />
            New request
          </Button>
          <Button variant="ghost" render={<Link href="/pull" />}>
            Open floor app
          </Button>
        </div>
      </div>

      {summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(
            [
              ["pending", summary.pending],
              ["sourced", summary.sourced],
              ["batched", summary.batched],
              ["pulled", summary.pulled],
              ["cancelled", summary.cancelled],
            ] as const
          ).map(([key, value]) => (
            <div
              key={key}
              className="rounded-lg border bg-card px-3 py-2 text-center"
            >
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground capitalize">{key}</p>
            </div>
          ))}
        </div>
      ) : null}

      <MaterialRequestsList
        initialRequests={requests}
        role={ctx?.role ?? "viewer"}
        highlightId={params.highlight}
      />
    </div>
  )
}
