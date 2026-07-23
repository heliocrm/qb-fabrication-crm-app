"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  cancelMaterialPullRequestAction,
  updateMaterialPullStatusAction,
} from "@/lib/actions/material-pull-requests"
import { canManageMaterialRequests } from "@/lib/auth/permissions"
import {
  formatNeededBy,
  MATERIAL_PULL_STATUS_LABELS,
  MATERIAL_PULL_STATUSES,
  statusBadgeClass,
} from "@/lib/material-pull-config"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { MaterialPullRequest, OrganizationRole } from "@/types"

interface MaterialRequestsListProps {
  initialRequests: MaterialPullRequest[]
  role: OrganizationRole
  highlightId?: string | null
  basePath?: string
}

export function MaterialRequestsList({
  initialRequests,
  role,
  highlightId,
  basePath = "/material-requests",
}: MaterialRequestsListProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string>("open")
  const [search, setSearch] = useState("")
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const canManage = canManageMaterialRequests(role)

  const filtered = useMemo(() => {
    return initialRequests.filter((r) => {
      if (statusFilter === "open") {
        if (!["pending", "approved", "batched"].includes(r.status)) return false
      } else if (statusFilter !== "all" && r.status !== statusFilter) {
        return false
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const hay = `${r.jobNumber} ${r.material} ${r.notes ?? ""} ${r.requestedByName ?? ""} ${r.location ?? ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [initialRequests, statusFilter, search])

  function runAction(id: string, fn: () => Promise<{ error?: string }>, okMsg: string) {
    setPendingId(id)
    startTransition(async () => {
      const result = await fn()
      setPendingId(null)
      if (result.error) {
        toast.error("Update failed", result.error)
        return
      }
      toast.success(okMsg)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { value: "open", label: "Open" },
            { value: "all", label: "All" },
            ...MATERIAL_PULL_STATUSES.map((s) => ({
              value: s,
              label: MATERIAL_PULL_STATUS_LABELS[s],
            })),
          ].map((opt) => (
            <Button
              key={opt.value}
              type="button"
              size="sm"
              variant={statusFilter === opt.value ? "default" : "outline"}
              className="min-h-11 touch-manipulation px-3"
              onClick={() => setStatusFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search job, material…"
          className="min-h-11 sm:max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No requests match.{" "}
          <a href={`${basePath}/new`} className="text-primary underline-offset-4 hover:underline">
            Submit a new request
          </a>
          .
        </div>
      ) : (
        <>
          <ul className="space-y-3 lg:hidden">
            {filtered.map((r) => (
              <li
                key={r.id}
                className={cn(
                  "rounded-lg border bg-card p-4 space-y-2",
                  highlightId === r.id && "ring-2 ring-[var(--orange)]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.jobNumber}</p>
                    <p className="text-sm">{r.material}</p>
                  </div>
                  <Badge className={cn("shrink-0", statusBadgeClass(r.status))}>
                    {MATERIAL_PULL_STATUS_LABELS[r.status]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {r.quantity} {r.unit} · Needed {formatNeededBy(r.neededBy)}
                  {r.location ? ` · ${r.location}` : ""}
                </p>
                {r.notes ? <p className="text-sm">{r.notes}</p> : null}
                <RequestActions
                  request={r}
                  canManage={canManage}
                  busy={isPending && pendingId === r.id}
                  onApprove={() =>
                    runAction(
                      r.id,
                      () => updateMaterialPullStatusAction(r.id, "approved"),
                      "Approved"
                    )
                  }
                  onPulled={() =>
                    runAction(
                      r.id,
                      () => updateMaterialPullStatusAction(r.id, "pulled"),
                      "Marked pulled"
                    )
                  }
                  onCancel={() =>
                    runAction(
                      r.id,
                      () => cancelMaterialPullRequestAction(r.id),
                      "Cancelled"
                    )
                  }
                />
              </li>
            ))}
          </ul>

          <div className="hidden lg:block overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Job</th>
                  <th className="px-3 py-2 font-medium">Material</th>
                  <th className="px-3 py-2 font-medium">Qty</th>
                  <th className="px-3 py-2 font-medium">Needed</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Requester</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className={cn(
                      "border-t",
                      highlightId === r.id && "bg-orange-50 dark:bg-orange-950/30"
                    )}
                  >
                    <td className="px-3 py-2 font-medium whitespace-nowrap">{r.jobNumber}</td>
                    <td className="px-3 py-2">
                      <div>{r.material}</div>
                      {r.notes ? (
                        <div className="text-xs text-muted-foreground line-clamp-1">{r.notes}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.quantity} {r.unit}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatNeededBy(r.neededBy)}</td>
                    <td className="px-3 py-2">
                      <Badge className={statusBadgeClass(r.status)}>
                        {MATERIAL_PULL_STATUS_LABELS[r.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {r.requestedByName ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <RequestActions
                        request={r}
                        canManage={canManage}
                        busy={isPending && pendingId === r.id}
                        onApprove={() =>
                          runAction(
                            r.id,
                            () => updateMaterialPullStatusAction(r.id, "approved"),
                            "Approved"
                          )
                        }
                        onPulled={() =>
                          runAction(
                            r.id,
                            () => updateMaterialPullStatusAction(r.id, "pulled"),
                            "Marked pulled"
                          )
                        }
                        onCancel={() =>
                          runAction(
                            r.id,
                            () => cancelMaterialPullRequestAction(r.id),
                            "Cancelled"
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function RequestActions({
  request,
  canManage,
  busy,
  onApprove,
  onPulled,
  onCancel,
}: {
  request: MaterialPullRequest
  canManage: boolean
  busy: boolean
  onApprove: () => void
  onPulled: () => void
  onCancel: () => void
}) {
  const showCancel =
    request.status === "pending" ||
    (canManage && request.status !== "pulled" && request.status !== "cancelled")

  return (
    <div className="flex flex-wrap gap-2">
      {busy ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : (
        <>
          {canManage && request.status === "pending" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-11 touch-manipulation"
              onClick={onApprove}
            >
              Approve
            </Button>
          ) : null}
          {canManage && (request.status === "approved" || request.status === "batched") ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-11 touch-manipulation"
              onClick={onPulled}
            >
              Pulled
            </Button>
          ) : null}
          {showCancel ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="min-h-11 touch-manipulation"
              onClick={onCancel}
            >
              Cancel
            </Button>
          ) : null}
        </>
      )}
    </div>
  )
}
