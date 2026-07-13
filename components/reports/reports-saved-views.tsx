"use client"

import { useState } from "react"
import { Bookmark, ChevronDown, Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  deleteReportViewAction,
  saveReportViewAction,
} from "@/lib/actions/report-views"
import { deserializeReportsFilters, type ReportsFilters } from "@/lib/reports/filters"
import { toast } from "@/lib/toast"
import type { ReportView } from "@/types"

interface ReportsSavedViewsProps {
  views: ReportView[]
  currentFilters: ReportsFilters
  onLoadView: (filters: ReportsFilters) => void
  onViewsChange: (views: ReportView[]) => void
}

export function ReportsSavedViews({
  views,
  currentFilters,
  onLoadView,
  onViewsChange,
}: ReportsSavedViewsProps) {
  const [saveOpen, setSaveOpen] = useState(false)
  const [viewName, setViewName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleSave() {
    const name = viewName.trim()
    if (!name) {
      toast.error("Name required", "Enter a name for this view.")
      return
    }

    setIsSaving(true)
    const result = await saveReportViewAction(name, currentFilters)
    setIsSaving(false)

    if (result.error) {
      toast.error("Save failed", result.error)
      return
    }

    if (result.data) {
      onViewsChange([result.data, ...views])
      toast.success("View saved")
      setViewName("")
      setSaveOpen(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteReportViewAction(id)
    setDeletingId(null)

    if (result.error) {
      toast.error("Delete failed", result.error)
      return
    }

    onViewsChange(views.filter((v) => v.id !== id))
    toast.success("View deleted")
  }

  function handleLoad(view: ReportView) {
    onLoadView(deserializeReportsFilters(view.filters))
    toast.success(`Loaded "${view.name}"`)
  }

  return (
    <div className="flex w-full sm:w-auto items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" className="h-9 flex-1 sm:flex-none gap-1.5">
              <Bookmark className="size-3.5" />
              My views
              <ChevronDown className="size-3.5 opacity-60" />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Your saved views</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {views.length === 0 ? (
            <div className="px-2 py-3 text-xs text-muted-foreground">
              No personal views yet. Save filters to reuse them later — only you can see them.
            </div>
          ) : (
            views.map((view) => (
              <DropdownMenuItem
                key={view.id}
                className="flex items-center justify-between gap-2"
                onClick={() => handleLoad(view)}
              >
                <span className="truncate">{view.name}</span>
                <button
                  type="button"
                  className="shrink-0 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(view.id)
                  }}
                  disabled={deletingId === view.id}
                  aria-label={`Delete ${view.name}`}
                >
                  {deletingId === view.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Trash2 className="size-3" />
                  )}
                </button>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        className="h-9 flex-1 sm:flex-none gap-1.5"
        onClick={() => setSaveOpen(true)}
      >
        <Plus className="size-3.5" />
        <span className="sm:inline">Save</span>
      </Button>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-sm mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Save your report view</DialogTitle>
            <DialogDescription>
              Saves the current filters for you only. Other teammates won’t see this view.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="View name, e.g. BPA Q3 pipeline"
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="size-4 animate-spin" data-icon="inline-start" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
