"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckSquare, Loader2, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FollowUpFormDialog } from "@/components/customers/follow-up-form-dialog"
import {
  completeCrmTaskAction,
  listCrmTasksForAccountAction,
  uncompleteCrmTaskAction,
} from "@/lib/actions/crm-tasks"
import { toast } from "@/lib/toast"
import type { Contact, CrmTask } from "@/types"

interface CustomerFollowUpsPanelProps {
  accountId: string
  contacts: Contact[]
  canWrite: boolean
  currentProfileId?: string | null
}

export function CustomerFollowUpsPanel({
  accountId,
  contacts,
  canWrite,
  currentProfileId,
}: CustomerFollowUpsPanelProps) {
  const [items, setItems] = useState<CrmTask[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    const result = await listCrmTasksForAccountAction(accountId, true)
    setLoading(false)
    if (result.error) {
      toast.error("Could not load follow-ups", result.error)
      return
    }
    if (result.data) setItems(result.data)
  }, [accountId])

  useEffect(() => {
    void reload()
  }, [reload])

  const open = items.filter((t) => !t.completedAt)
  const done = items.filter((t) => t.completedAt)

  async function toggleComplete(task: CrmTask) {
    setTogglingId(task.id)
    const result = task.completedAt
      ? await uncompleteCrmTaskAction(task.id)
      : await completeCrmTaskAction(task.id)
    setTogglingId(null)
    if (result.error) {
      toast.error("Could not update follow-up", result.error)
      return
    }
    void reload()
  }

  return (
    <>
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CheckSquare className="size-4" />
            Follow-ups
            {!loading ? (
              <Badge variant="secondary" className="text-[10px]">
                {open.length} open
              </Badge>
            ) : null}
          </CardTitle>
          {canWrite ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setFormOpen(true)}
            >
              <Plus className="size-4" data-icon="inline-start" />
              Add follow-up
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="size-4 animate-spin" />
              Loading follow-ups…
            </div>
          ) : open.length === 0 && done.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No CRM follow-ups yet. Use these for sales/relationship work — shop
              checklist tasks stay on the job.
            </p>
          ) : (
            <ul className="space-y-2">
              {open.map((task) => (
                <FollowUpRow
                  key={task.id}
                  task={task}
                  canWrite={canWrite}
                  busy={togglingId === task.id}
                  onToggle={() => void toggleComplete(task)}
                />
              ))}
              {done.slice(0, 5).map((task) => (
                <FollowUpRow
                  key={task.id}
                  task={task}
                  canWrite={canWrite}
                  busy={togglingId === task.id}
                  onToggle={() => void toggleComplete(task)}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {canWrite ? (
        <FollowUpFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          accountId={accountId}
          contacts={contacts}
          currentProfileId={currentProfileId}
          onSaved={() => void reload()}
        />
      ) : null}
    </>
  )
}

function FollowUpRow({
  task,
  canWrite,
  busy,
  onToggle,
}: {
  task: CrmTask
  canWrite: boolean
  busy: boolean
  onToggle: () => void
}) {
  const done = Boolean(task.completedAt)
  const overdue =
    !done &&
    task.dueAt &&
    new Date(task.dueAt).getTime() < Date.now()

  return (
    <li
      className={`flex items-start gap-2 rounded-md border px-3 py-2 ${
        done ? "opacity-60" : ""
      }`}
    >
      {canWrite ? (
        <button
          type="button"
          className="mt-0.5 size-4 shrink-0 rounded border border-input flex items-center justify-center"
          onClick={onToggle}
          disabled={busy}
          aria-label={done ? "Reopen follow-up" : "Complete follow-up"}
        >
          {busy ? (
            <Loader2 className="size-3 animate-spin" />
          ) : done ? (
            <span className="text-[10px] font-bold text-[var(--orange)]">✓</span>
          ) : null}
        </button>
      ) : (
        <span className="mt-0.5 size-4 shrink-0" />
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p
          className={`text-sm font-medium ${done ? "line-through" : ""}`}
        >
          {task.title}
        </p>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {task.ownerName ? <span>{task.ownerName}</span> : null}
          {task.dueAt ? (
            <span className={overdue ? "text-destructive font-medium" : ""}>
              Due {new Date(task.dueAt).toLocaleDateString()}
            </span>
          ) : (
            <span>No due date</span>
          )}
        </div>
      </div>
    </li>
  )
}
