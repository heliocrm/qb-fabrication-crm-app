"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Printer } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  createMaterialPullBatchAction,
  markBatchPulledAction,
} from "@/lib/actions/material-pull-requests"
import { canManageMaterialRequests } from "@/lib/auth/permissions"
import {
  createDefaultPullChecklist,
  formatNeededBy,
  MATERIAL_PULL_CANNED_NOTES,
  MATERIAL_PULL_STATUS_LABELS,
  statusBadgeClass,
  type MaterialPullChecklist,
} from "@/lib/material-pull-config"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { MaterialPullRequest, OrganizationRole } from "@/types"

interface MaterialBatchClientProps {
  requests: MaterialPullRequest[]
  role: OrganizationRole
  initialBatchId?: string | null
}

type ConfirmKind = "create" | "pulled" | null

export function MaterialBatchClient({
  requests,
  role,
  initialBatchId,
}: MaterialBatchClientProps) {
  const router = useRouter()
  const canManage = canManageMaterialRequests(role)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeBatchId, setActiveBatchId] = useState<string | null>(
    initialBatchId ?? null
  )
  const [isPending, startTransition] = useTransition()
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null)
  const [confirmBatchId, setConfirmBatchId] = useState<string | null>(null)
  const [checklist, setChecklist] = useState<MaterialPullChecklist>(() =>
    createDefaultPullChecklist()
  )
  const [notePreset, setNotePreset] = useState<string>(MATERIAL_PULL_CANNED_NOTES[0])
  const [noteExtra, setNoteExtra] = useState("")

  const batchable = useMemo(
    () =>
      requests.filter((r) => r.status === "pending" || r.status === "approved"),
    [requests]
  )

  const batchedGroups = useMemo(() => {
    const map = new Map<string, MaterialPullRequest[]>()
    for (const r of requests) {
      if (!r.batchId || r.status === "cancelled") continue
      const list = map.get(r.batchId) ?? []
      list.push(r)
      map.set(r.batchId, list)
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [requests])

  const printRows = useMemo(() => {
    if (activeBatchId) {
      return requests.filter((r) => r.batchId === activeBatchId)
    }
    return batchable.filter((r) => selected.has(r.id))
  }, [activeBatchId, requests, batchable, selected])

  const checklistComplete = checklist.items.every((i) => i.done)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(batchable.map((r) => r.id)))
  }

  function openCreateConfirm() {
    if (selected.size === 0) {
      toast.error("Select requests", "Choose at least one item for the pull list.")
      return
    }
    setConfirmKind("create")
  }

  function openPulledConfirm(batchId: string) {
    setChecklist(createDefaultPullChecklist())
    setNotePreset(MATERIAL_PULL_CANNED_NOTES[0])
    setNoteExtra("")
    setConfirmBatchId(batchId)
    setConfirmKind("pulled")
  }

  function confirmCreateBatch() {
    setConfirmKind(null)
    startTransition(async () => {
      const result = await createMaterialPullBatchAction([...selected])
      if (result.error) {
        toast.error("Batch failed", result.error)
        return
      }
      const batchId = result.data?.[0]?.batchId ?? null
      setActiveBatchId(batchId)
      setSelected(new Set())
      toast.success("Batch created", "Pull list is ready.")
      router.refresh()
    })
  }

  function confirmMarkPulled() {
    if (!confirmBatchId) return
    if (!checklistComplete) {
      toast.error("Checklist incomplete", "Check all items or finish them before confirming.")
      return
    }
    const pullNotes = [notePreset, noteExtra.trim()].filter(Boolean).join(" — ")
    const batchId = confirmBatchId
    setConfirmKind(null)
    setConfirmBatchId(null)
    startTransition(async () => {
      const result = await markBatchPulledAction(batchId, {
        pullNotes,
        pullChecklist: {
          ...checklist,
          notePreset,
          completedAt: new Date().toISOString(),
        },
      })
      if (result.error) {
        toast.error("Update failed", result.error)
        return
      }
      toast.success("Batch marked pulled")
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {!canManage ? (
        <p className="text-sm text-muted-foreground">
          View-only. Managers create batches and mark pulls complete.
        </p>
      ) : null}

      <section className="space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Ready to batch</h2>
          {canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11 touch-manipulation"
                onClick={selectAll}
              >
                Select all
              </Button>
              <Button
                type="button"
                size="sm"
                className="min-h-11 touch-manipulation"
                onClick={openCreateConfirm}
                disabled={isPending || selected.size === 0}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Create pull list ({selected.size})
              </Button>
            </div>
          ) : null}
        </div>

        {batchable.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-6 text-center">
            No pending or approved requests to batch.
          </p>
        ) : (
          <ul className="space-y-2">
            {batchable.map((r) => (
              <li
                key={r.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                {canManage ? (
                  <Checkbox
                    checked={selected.has(r.id)}
                    onCheckedChange={() => toggle(r.id)}
                    className="mt-1 size-5 touch-manipulation"
                    aria-label={`Select ${r.material}`}
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.jobNumber}</span>
                    <Badge className={statusBadgeClass(r.status)}>
                      {MATERIAL_PULL_STATUS_LABELS[r.status]}
                    </Badge>
                  </div>
                  <p className="text-sm">
                    {r.quantity} {r.unit} · {r.material}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Needed {formatNeededBy(r.neededBy)}
                    {r.location ? ` · ${r.location}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
          <h2 className="text-lg font-semibold">Pull lists</h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11 touch-manipulation"
            onClick={() => window.print()}
            disabled={printRows.length === 0}
          >
            <Printer className="size-4" />
            Print
          </Button>
        </div>

        {batchedGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground print:hidden">
            No active batches yet. Select items above and create a pull list.
          </p>
        ) : (
          batchedGroups.map(([batchId, items]) => (
            <div
              key={batchId}
              className={cn(
                "rounded-lg border p-4 space-y-3",
                activeBatchId === batchId && "ring-2 ring-[var(--orange)]"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
                <button
                  type="button"
                  className="text-left font-medium hover:underline min-h-11 touch-manipulation"
                  onClick={() => setActiveBatchId(batchId)}
                >
                  Batch {batchId.slice(0, 8)} · {items.length} items
                </button>
                {canManage && items.some((i) => i.status === "batched") ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-11 touch-manipulation"
                    disabled={isPending}
                    onClick={() => openPulledConfirm(batchId)}
                  >
                    Mark all pulled
                  </Button>
                ) : null}
              </div>
              <PrintableTable rows={items} />
            </div>
          ))
        )}

        <div className="hidden print:block">
          <h1 className="text-xl font-bold mb-2">QB Fabrication — Material Pull List</h1>
          <p className="text-sm mb-4">
            Printed {new Date().toLocaleString()} · {printRows.length} line(s)
          </p>
          <PrintableTable rows={printRows} />
        </div>
      </section>

      <Dialog
        open={confirmKind === "create"}
        onOpenChange={(open) => !open && setConfirmKind(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create pull list?</DialogTitle>
            <DialogDescription>
              Batch {selected.size} selected request(s) into one printable pull list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmKind(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmCreateBatch} disabled={isPending}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmKind === "pulled"}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmKind(null)
            setConfirmBatchId(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete pull</DialogTitle>
            <DialogDescription>
              Check each step, pick a note, then confirm. All items in this batch will be marked pulled.
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-2">
            {checklist.items.map((item, index) => (
              <li key={item.id} className="flex items-center gap-3 min-h-11">
                <Checkbox
                  checked={item.done}
                  onCheckedChange={(checked) => {
                    setChecklist((prev) => ({
                      ...prev,
                      items: prev.items.map((it, i) =>
                        i === index ? { ...it, done: checked === true } : it
                      ),
                    }))
                  }}
                  className="size-5 touch-manipulation"
                  id={`check-${item.id}`}
                />
                <label htmlFor={`check-${item.id}`} className="text-sm">
                  {item.label}
                </label>
              </li>
            ))}
          </ul>

          <div className="space-y-1.5">
            <label htmlFor="pull-note-preset" className="text-sm font-medium">
              Completion note
            </label>
            <select
              id="pull-note-preset"
              value={notePreset}
              onChange={(e) => setNotePreset(e.target.value)}
              className="flex min-h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base md:text-sm shadow-xs"
            >
              {MATERIAL_PULL_CANNED_NOTES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pull-note-extra" className="text-sm font-medium">
              Extra detail (optional)
            </label>
            <Input
              id="pull-note-extra"
              value={noteExtra}
              onChange={(e) => setNoteExtra(e.target.value)}
              placeholder="Bay, rack, substitute size…"
              className="min-h-11"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmKind(null)
                setConfirmBatchId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmMarkPulled}
              disabled={isPending || !checklistComplete}
            >
              Confirm pulled
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PrintableTable({ rows }: { rows: MaterialPullRequest[] }) {
  if (rows.length === 0) return null
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b text-left">
          <th className="py-1 pr-2">Job</th>
          <th className="py-1 pr-2">Material</th>
          <th className="py-1 pr-2">Qty</th>
          <th className="py-1 pr-2">Needed</th>
          <th className="py-1 pr-2">Location</th>
          <th className="py-1">Notes</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-b align-top">
            <td className="py-1.5 pr-2 whitespace-nowrap font-medium">{r.jobNumber}</td>
            <td className="py-1.5 pr-2">{r.material}</td>
            <td className="py-1.5 pr-2 whitespace-nowrap">
              {r.quantity} {r.unit}
            </td>
            <td className="py-1.5 pr-2 whitespace-nowrap">{formatNeededBy(r.neededBy)}</td>
            <td className="py-1.5 pr-2">{r.location ?? "—"}</td>
            <td className="py-1.5">
              {[r.notes, r.pullNotes].filter(Boolean).join(" · ") || ""}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
