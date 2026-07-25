"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FloorSignoffDialog,
  SignoffBadge,
} from "@/components/floor/floor-signoff-dialog"
import {
  getFloorSignoffContextAction,
  listFloorTasksForLineItemAction,
} from "@/lib/actions/floor-signoff"
import type {
  FloorWorkerOption,
  Task,
  TaskSignoff,
  TravelerLine,
} from "@/types"

export function FloorLineChecklist({
  jobId,
  line,
  canSignOff = true,
}: {
  jobId: string
  line: TravelerLine
  canSignOff?: boolean
}) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [signoffs, setSignoffs] = useState<Record<string, TaskSignoff>>({})
  const [workers, setWorkers] = useState<FloorWorkerOption[]>([])
  const [isStationAccount, setIsStationAccount] = useState(false)
  const [selfProfileId, setSelfProfileId] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const load = useCallback(async () => {
    if (!line.lineItemId) {
      setTasks([])
      setLoading(false)
      return
    }
    setLoading(true)
    const [ctxRes, tasksRes] = await Promise.all([
      getFloorSignoffContextAction(jobId),
      listFloorTasksForLineItemAction(line.lineItemId),
    ])
    if (ctxRes.data) {
      setWorkers(ctxRes.data.workers)
      setIsStationAccount(ctxRes.data.isStationAccount)
      setSelfProfileId(ctxRes.data.selfProfileId)
    }
    if (tasksRes.data) {
      setTasks(tasksRes.data.tasks)
      setSignoffs(tasksRes.data.signoffsByTaskId)
    }
    setLoading(false)
  }, [jobId, line.lineItemId])

  useEffect(() => {
    void load()
  }, [load])

  if (!line.lineItemId) {
    return (
      <p className="text-xs text-muted-foreground">
        No linked production line item — re-import traveler to seed checklists.
      </p>
    )
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="size-3.5 animate-spin" /> Loading floor steps…
      </p>
    )
  }

  if (!tasks.length) {
    return (
      <p className="text-xs text-muted-foreground">
        No floor checklist tasks on this line item.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Floor sign-off
      </p>
      <ul className="space-y-2">
        {tasks.map((task) => {
          const signoff = signoffs[task.id]
          return (
            <li
              key={task.id}
              className="rounded-md border bg-background/60 px-3 py-2 space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{task.title}</p>
                  <Badge variant="outline" className="text-[10px] mt-1">
                    {task.category}
                  </Badge>
                </div>
                {canSignOff && !signoff ? (
                  <Button
                    type="button"
                    size="sm"
                    className="min-h-10 shrink-0 touch-manipulation"
                    onClick={() => setActiveTask(task)}
                  >
                    Sign off
                  </Button>
                ) : null}
              </div>
              {signoff ? <SignoffBadge signoff={signoff} /> : null}
              {task.completed && !signoff ? (
                <p className="text-[10px] text-muted-foreground">
                  Marked complete (no floor attestation)
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>

      <FloorSignoffDialog
        open={Boolean(activeTask)}
        onOpenChange={(open) => {
          if (!open) setActiveTask(null)
        }}
        jobId={jobId}
        task={activeTask}
        travelerLineId={line.id}
        workers={workers}
        isStationAccount={isStationAccount}
        selfProfileId={selfProfileId}
        onSigned={(signoff) => {
          setSignoffs((prev) => ({ ...prev, [signoff.taskId]: signoff }))
          setTasks((prev) =>
            prev.map((t) =>
              t.id === signoff.taskId ? { ...t, completed: true } : t
            )
          )
        }}
      />
    </div>
  )
}
