"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  cancelMaterialPullRequestAction,
  updateMaterialPullRequestAction,
  updateMaterialPullStatusAction,
} from "@/lib/actions/material-pull-requests"
import {
  canApproveMaterialAllocation,
  canApproveMaterialRequests,
  canBatchMaterialRequests,
  canManageMaterialRequests,
} from "@/lib/auth/permissions"
import {
  formatNeededBy,
  isBorrowRequest,
  MATERIAL_PULL_REASON_CODES_SELECTABLE,
  MATERIAL_PULL_LOCATIONS,
  MATERIAL_PULL_PRIORITIES,
  MATERIAL_PULL_PRIORITY_LABELS,
  MATERIAL_PULL_REASON_LABELS,
  MATERIAL_PULL_STATUS_LABELS,
  priorityBadgeClass,
  statusBadgeClass,
} from "@/lib/material-pull-config"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type {
  MaterialPullCapabilities,
  MaterialPullPriority,
  MaterialPullReasonCode,
  MaterialPullRequest,
  OrganizationRole,
} from "@/types"
import { DEFAULT_MATERIAL_PULL_CAPABILITIES } from "@/types/Profile"

interface MaterialRequestDetailProps {
  request: MaterialPullRequest
  role: OrganizationRole
  profileId: string
  capabilities?: MaterialPullCapabilities
  backHref: string
}

export function MaterialRequestDetail({
  request,
  role,
  profileId,
  capabilities = DEFAULT_MATERIAL_PULL_CAPABILITIES,
  backHref,
}: MaterialRequestDetailProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [editPriority, setEditPriority] = useState<MaterialPullPriority>(
    request.priority
  )
  const [editReasonCode, setEditReasonCode] = useState<MaterialPullReasonCode>(
    request.reasonCode
  )
  const [editLocation, setEditLocation] = useState(
    request.location ?? MATERIAL_PULL_LOCATIONS[0]
  )
  const [editBorrowing, setEditBorrowing] = useState(isBorrowRequest(request))
  const [editSourceJob, setEditSourceJob] = useState(
    request.sourceJobNumber ?? ""
  )

  const canApprove = canApproveMaterialRequests(role, capabilities)
  const canAllocate = canApproveMaterialAllocation(role, capabilities)
  const canBatch = canBatchMaterialRequests(role, capabilities)
  const canManage = canManageMaterialRequests(role, capabilities)
  const canEditPending =
    request.status === "pending" &&
    (request.requestedBy === profileId || canManage)

  const borrowPending =
    request.status === "pending" && isBorrowRequest(request)
  const showApprove =
    request.status === "pending" &&
    (borrowPending ? canAllocate : canApprove || canAllocate)

  function run(fn: () => Promise<{ error?: string }>, ok: string) {
    startTransition(async () => {
      const result = await fn()
      if (result.error) {
        toast.error("Update failed", result.error)
        return
      }
      toast.success(ok)
      setEditing(false)
      router.refresh()
    })
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const sourceJobNumber = editBorrowing
      ? editSourceJob.trim() || null
      : null
    if (editBorrowing && !sourceJobNumber) {
      toast.error("Missing fields", "Source job # is required when borrowing.")
      return
    }
    const reasonForSave =
      editReasonCode === "borrow" ? "other" : editReasonCode
    run(
      () =>
        updateMaterialPullRequestAction(request.id, {
          jobNumber: String(fd.get("jobNumber") ?? "").trim(),
          material: String(fd.get("material") ?? "").trim(),
          quantity: Number(fd.get("quantity")),
          unit: String(fd.get("unit") ?? "ea").trim() || "ea",
          neededBy: String(fd.get("neededBy") ?? "").trim(),
          location: editLocation || null,
          notes: String(fd.get("notes") ?? "").trim() || null,
          priority: editPriority,
          reasonCode: reasonForSave,
          sourceJobNumber,
        }),
      "Request updated"
    )
  }

  function startEditing() {
    setEditPriority(request.priority)
    setEditReasonCode(
      request.reasonCode === "borrow" ? "other" : request.reasonCode
    )
    setEditLocation(request.location ?? MATERIAL_PULL_LOCATIONS[0])
    setEditBorrowing(isBorrowRequest(request))
    setEditSourceJob(request.sourceJobNumber ?? "")
    setEditing(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link href={backHref} />}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-xl">{request.jobNumber}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{request.material}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-end">
              <Badge className={statusBadgeClass(request.status)}>
                {MATERIAL_PULL_STATUS_LABELS[request.status]}
              </Badge>
              <Badge className={priorityBadgeClass(request.priority)}>
                {MATERIAL_PULL_PRIORITY_LABELS[request.priority]}
              </Badge>
              {borrowPending ? <Badge variant="outline">Needs PM</Badge> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!editing ? (
            <>
              <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Quantity</dt>
                  <dd className="font-medium">
                    {request.quantity} {request.unit}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Needed by</dt>
                  <dd className="font-medium">{formatNeededBy(request.neededBy)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="font-medium">{request.location ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Reason</dt>
                  <dd className="font-medium">
                    {MATERIAL_PULL_REASON_LABELS[request.reasonCode]}
                    {request.sourceJobNumber
                      ? ` (from ${request.sourceJobNumber})`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Requester</dt>
                  <dd className="font-medium">{request.requestedByName ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="font-medium">
                    {new Date(request.createdAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
              {request.notes ? (
                <div className="text-sm">
                  <p className="text-muted-foreground">Notes</p>
                  <p>{request.notes}</p>
                </div>
              ) : null}
              {request.pullNotes ? (
                <div className="text-sm">
                  <p className="text-muted-foreground">Pull notes</p>
                  <p>{request.pullNotes}</p>
                </div>
              ) : null}

              <div className="rounded-lg border p-3 text-sm space-y-1">
                <p className="font-medium">Trail</p>
                <p className="text-muted-foreground">
                  Requested by {request.requestedByName ?? "user"} ·{" "}
                  {new Date(request.createdAt).toLocaleString()}
                </p>
                {request.approvedBy ? (
                  <p className="text-muted-foreground">
                    Approved (actor id {request.approvedBy.slice(0, 8)}…) · status{" "}
                    {MATERIAL_PULL_STATUS_LABELS[request.status]}
                  </p>
                ) : null}
                {request.pulledBy ? (
                  <p className="text-muted-foreground">
                    Pulled (actor id {request.pulledBy.slice(0, 8)}…)
                  </p>
                ) : null}
                {request.batchId ? (
                  <p className="text-muted-foreground">
                    Batch {request.batchId.slice(0, 8)}…
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Job #">
                  <Input
                    name="jobNumber"
                    defaultValue={request.jobNumber}
                    required
                    className="min-h-11"
                  />
                </Field>
                <Field label="Needed by">
                  <Input
                    name="neededBy"
                    type="date"
                    defaultValue={request.neededBy ?? ""}
                    required
                    className="min-h-11"
                  />
                </Field>
                <Field label="Priority">
                  <Select
                    value={editPriority}
                    onValueChange={(value) => {
                      if (value != null) setEditPriority(value as MaterialPullPriority)
                    }}
                  >
                    <SelectTrigger className="min-h-11 w-full bg-background text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_PULL_PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {MATERIAL_PULL_PRIORITY_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Reason">
                  <Select
                    value={editReasonCode === "borrow" ? "other" : editReasonCode}
                    onValueChange={(value) => {
                      if (value != null)
                        setEditReasonCode(value as MaterialPullReasonCode)
                    }}
                  >
                    <SelectTrigger className="min-h-11 w-full bg-background text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_PULL_REASON_CODES_SELECTABLE.map((c) => (
                        <SelectItem key={c} value={c}>
                          {MATERIAL_PULL_REASON_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="sm:col-span-2 space-y-3">
                  <label className="flex items-start gap-2.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editBorrowing}
                      onChange={(e) => setEditBorrowing(e.target.checked)}
                      className="mt-0.5 size-4 rounded border-input"
                    />
                    <span className="font-medium">Borrowing from another job</span>
                  </label>
                  {editBorrowing ? (
                    <Field label="Borrow from job #">
                      <Input
                        value={editSourceJob}
                        onChange={(e) => setEditSourceJob(e.target.value)}
                        className="min-h-11"
                        required
                      />
                    </Field>
                  ) : null}
                </div>
                <Field label="Material">
                  <Input
                    name="material"
                    defaultValue={request.material}
                    required
                    className="min-h-11"
                  />
                </Field>
                <Field label="Qty">
                  <Input
                    name="quantity"
                    type="number"
                    min={0.01}
                    step="any"
                    defaultValue={request.quantity}
                    required
                    className="min-h-11"
                  />
                </Field>
                <Field label="Unit">
                  <Input
                    name="unit"
                    defaultValue={request.unit}
                    className="min-h-11"
                  />
                </Field>
                <Field label="Location">
                  <Select
                    value={editLocation}
                    onValueChange={(value) => {
                      if (value != null) setEditLocation(value)
                    }}
                  >
                    <SelectTrigger className="min-h-11 w-full bg-background text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_PULL_LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Notes">
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={request.notes ?? ""}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px]"
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isPending} className="min-h-11">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => setEditing(false)}
                >
                  Cancel edit
                </Button>
              </div>
            </form>
          )}

          {!editing ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {canEditPending ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={startEditing}
                >
                  Edit
                </Button>
              ) : null}
              {showApprove ? (
                <Button
                  type="button"
                  className="min-h-11"
                  disabled={isPending}
                  onClick={() =>
                    run(
                      () => updateMaterialPullStatusAction(request.id, "approved"),
                      "Approved"
                    )
                  }
                >
                  {borrowPending ? "PM approve borrow" : "Approve"}
                </Button>
              ) : null}
              {canBatch &&
              (request.status === "approved" || request.status === "batched") ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={isPending}
                  onClick={() =>
                    run(
                      () => updateMaterialPullStatusAction(request.id, "pulled"),
                      "Marked pulled"
                    )
                  }
                >
                  Mark pulled
                </Button>
              ) : null}
              {request.status === "pending" ||
              (canManage &&
                request.status !== "pulled" &&
                request.status !== "cancelled") ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11"
                  disabled={isPending}
                  onClick={() =>
                    run(
                      () => cancelMaterialPullRequestAction(request.id),
                      "Cancelled"
                    )
                  }
                >
                  Cancel request
                </Button>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("space-y-1.5")}>
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}
