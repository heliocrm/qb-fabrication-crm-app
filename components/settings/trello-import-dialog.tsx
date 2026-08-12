"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
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
  commitTrelloImportAction,
  previewTrelloImportAction,
} from "@/lib/actions/trello-import"
import type { TrelloImportPreviewRow } from "@/lib/trello/import/service"
import { toast } from "@/lib/toast"

type DraftRow = TrelloImportPreviewRow & { selected: boolean }

interface TrelloImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCommitted?: () => void
}

export function TrelloImportDialog({
  open,
  onOpenChange,
  onCommitted,
}: TrelloImportDialogProps) {
  const [loading, setLoading] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [rows, setRows] = useState<DraftRow[]>([])
  const [scanned, setScanned] = useState(0)
  const [search, setSearch] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const result = await previewTrelloImportAction()
    setLoading(false)
    if (result.error) {
      toast.error("Trello preview failed", result.error)
      return
    }
    const data = result.data
    if (!data) return
    setScanned(data.scanned)
    setRows(
      data.rows.map((row) => ({
        ...row,
        selected: row.match === "new",
      }))
    )
  }, [])

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.boardName.toLowerCase().includes(q) ||
        r.proposedJobNumber.toLowerCase().includes(q) ||
        (r.existingJobNumber?.toLowerCase().includes(q) ?? false)
    )
  }, [rows, search])

  const selectedCount = rows.filter((r) => r.selected).length

  function toggleAllVisible(selected: boolean) {
    const visibleIds = new Set(filtered.map((r) => r.boardId))
    setRows((prev) =>
      prev.map((r) => (visibleIds.has(r.boardId) ? { ...r, selected } : r))
    )
  }

  async function handleCommit() {
    const ids = rows.filter((r) => r.selected).map((r) => r.boardId)
    if (ids.length === 0) {
      toast.error("Nothing selected", "Choose at least one board.")
      return
    }
    setCommitting(true)
    const result = await commitTrelloImportAction(ids)
    setCommitting(false)
    if (result.error) {
      toast.error("Trello import failed", result.error)
      return
    }
    const created =
      result.data?.results.filter((r) => r.match === "new").length ?? 0
    const updated =
      result.data?.results.filter((r) => r.match === "update").length ?? 0
    toast.success(
      "Trello import complete",
      `${created} created, ${updated} updated`
    )
    onOpenChange(false)
    onCommitted?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Trello boards</DialogTitle>
          <DialogDescription>
            Each board becomes a CRM job; cards become line items; checklist
            items become tasks. Already-imported boards show as Update.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search boards…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toggleAllVisible(true)}
            disabled={loading || filtered.length === 0}
          >
            Select visible
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toggleAllVisible(false)}
            disabled={loading || filtered.length === 0}
          >
            Clear visible
          </Button>
          <span className="text-xs text-muted-foreground ml-auto">
            {scanned} boards scanned · {selectedCount} selected
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-auto border rounded-md">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading boards from Trello…
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No boards found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background border-b">
                <tr className="text-left">
                  <th className="p-2 w-10" />
                  <th className="p-2">Board</th>
                  <th className="p-2">Cards</th>
                  <th className="p-2">Checks</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Match</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.boardId} className="border-b last:border-0">
                    <td className="p-2 align-top">
                      <Checkbox
                        checked={row.selected}
                        onCheckedChange={(v) => {
                          const selected = v === true
                          setRows((prev) =>
                            prev.map((r) =>
                              r.boardId === row.boardId
                                ? { ...r, selected }
                                : r
                            )
                          )
                        }}
                      />
                    </td>
                    <td className="p-2 align-top">
                      <div className="font-medium">{row.boardName}</div>
                      <div className="text-xs text-muted-foreground">
                        Job # {row.existingJobNumber ?? row.proposedJobNumber}
                        {row.listNames.length > 0
                          ? ` · Lists: ${row.listNames.slice(0, 4).join(", ")}${
                              row.listNames.length > 4 ? "…" : ""
                            }`
                          : null}
                      </div>
                    </td>
                    <td className="p-2 align-top tabular-nums">{row.cardCount}</td>
                    <td className="p-2 align-top tabular-nums">
                      {row.checklistItemCount}
                    </td>
                    <td className="p-2 align-top text-xs">{row.inferredStatus}</td>
                    <td className="p-2 align-top">
                      <Badge
                        variant={row.match === "new" ? "default" : "secondary"}
                      >
                        {row.match === "new" ? "New" : "Update"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={committing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleCommit()}
            disabled={loading || committing || selectedCount === 0}
          >
            {committing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Importing…
              </>
            ) : (
              `Import ${selectedCount || ""}`.trim()
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
