import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { MaterialBatchClient } from "@/components/material-requests/material-batch-client"
import { Button } from "@/components/ui/button"
import {
  canManageMaterialRequests,
  getSessionContext,
} from "@/lib/auth/session"
import { loadMaterialPullRequests } from "@/lib/data/material-pull-requests"

export const metadata = {
  title: "Pull List / Batch",
}

export default async function MaterialBatchPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>
}) {
  const params = await searchParams
  const ctx = await getSessionContext()
  const role = ctx?.role ?? "viewer"
  if (!canManageMaterialRequests(role)) {
    redirect("/material-requests")
  }

  const { requests } = await loadMaterialPullRequests({ status: "all" })

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div>
          <Button variant="ghost" size="sm" render={<Link href="/material-requests" />}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight mt-2">
            Batch / Pull list
          </h1>
          <p className="text-sm text-muted-foreground">
            Select pending or approved items → generate a printable pull list.
          </p>
        </div>
      </div>
      <MaterialBatchClient
        requests={requests}
        role={role}
        initialBatchId={params.batch}
      />
    </div>
  )
}
