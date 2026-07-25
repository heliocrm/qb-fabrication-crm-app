"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { signOffTaskAction } from "@/lib/actions/floor-signoff"
import {
  FLOOR_NOTE_MAX_CHARS,
  FLOOR_SIGNOFF_REASON_CODES,
  FLOOR_SIGNOFF_REASON_LABELS,
  type FloorSignoffReasonCode,
} from "@/lib/floor-signoff-reasons"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { FloorWorkerOption, Task, TaskSignoff } from "@/types"

export function FloorSignoffDialog({
  open,
  onOpenChange,
  jobId,
  task,
  travelerLineId,
  workers,
  isStationAccount,
  selfProfileId,
  onSigned,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  task: Task | null
  travelerLineId?: string | null
  workers: FloorWorkerOption[]
  isStationAccount: boolean
  selfProfileId: string
  onSigned: (signoff: TaskSignoff) => void
}) {
  const [pending, startTransition] = useTransition()
  const [workerId, setWorkerId] = useState("")
  const [pin, setPin] = useState("")
  const [reasons, setReasons] = useState<FloorSignoffReasonCode[]>([])
  const [note, setNote] = useState("")

  const defaultWorkerId = useMemo(() => {
    if (isStationAccount) return ""
    if (workers.some((w) => w.id === selfProfileId)) return selfProfileId
    return workers[0]?.id ?? ""
  }, [isStationAccount, selfProfileId, workers])

  useEffect(() => {
    if (!open) return
    setWorkerId(defaultWorkerId)
    setPin("")
    setReasons([])
    setNote("")
  }, [open, defaultWorkerId, task?.id])

  function toggleReason(code: FloorSignoffReasonCode) {
    setReasons((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  function submit() {
    if (!task) return
    startTransition(async () => {
      const res = await signOffTaskAction({
        jobId,
        taskId: task.id,
        workerProfileId: workerId,
        pin,
        reasonCodes: reasons,
        note: note.trim() || undefined,
        travelerLineId,
      })
      if (res.error || !res.data) {
        toast.error(res.error ?? "Sign-off failed")
        return
      }
      toast.success("Signed off")
      onSigned(res.data.signoff)
      onOpenChange(false)
    })
  }

  const noteRequired = reasons.includes("partial_qty")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sign off</DialogTitle>
          <DialogDescription>
            {task
              ? `${task.title} · ${task.category}`
              : "Confirm who completed this step"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="floor-worker" className="text-sm font-medium">
              Worker
            </label>
            {workers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No workers have a floor PIN yet. Ask an admin to set PINs in
                Admin → Users.
              </p>
            ) : (
              <select
                id="floor-worker"
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base"
              >
                {isStationAccount ? (
                  <option value="">Select worker…</option>
                ) : null}
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.fullName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="floor-pin" className="text-sm font-medium">
              PIN
            </label>
            <Input
              id="floor-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              className="min-h-12 text-2xl tracking-[0.4em] font-mono text-center"
              placeholder="••••"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 8))
              }
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Reason</p>
            <div className="flex flex-wrap gap-2">
              {FLOOR_SIGNOFF_REASON_CODES.map((code) => {
                const active = reasons.includes(code)
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggleReason(code)}
                    className={cn(
                      "rounded-full border px-3 py-2 text-xs font-medium touch-manipulation min-h-10",
                      active
                        ? "border-[var(--orange)] bg-[var(--orange)]/15 text-foreground"
                        : "bg-card text-muted-foreground"
                    )}
                  >
                    {FLOOR_SIGNOFF_REASON_LABELS[code]}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="floor-note" className="text-sm font-medium">
              Note {noteRequired ? "(required for partial qty)" : "(optional)"}
            </label>
            <Input
              id="floor-note"
              className="min-h-11"
              maxLength={FLOOR_NOTE_MAX_CHARS}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Short note…"
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {note.length}/{FLOOR_NOTE_MAX_CHARS}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="min-h-11 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
            disabled={
              pending ||
              !task ||
              !workerId ||
              pin.length < 4 ||
              reasons.length === 0 ||
              (noteRequired && !note.trim())
            }
            onClick={submit}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Signing…
              </>
            ) : (
              "Confirm sign-off"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SignoffBadge({ signoff }: { signoff: TaskSignoff }) {
  return (
    <Badge variant="outline" className="text-[10px] font-normal max-w-full">
      <span className="truncate">
        Signed by {signoff.signedByName ?? "worker"} ·{" "}
        {new Date(signoff.signedAt).toLocaleString()}
      </span>
    </Badge>
  )
}
