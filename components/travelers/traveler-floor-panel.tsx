"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FloorLineChecklist } from "@/components/floor/floor-line-checklist"
import { getActiveTravelerAction } from "@/lib/actions/travelers"
import type { Traveler } from "@/types"

export function TravelerFloorPanel({
  jobId,
  jobNumber,
  description,
}: {
  jobId: string
  jobNumber: string
  description: string
}) {
  const [traveler, setTraveler] = useState<Traveler | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void getActiveTravelerAction(jobId).then((res) => {
      setTraveler(res.data ?? null)
      setLoading(false)
    })
  }, [jobId])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading traveler…
      </div>
    )
  }

  if (!traveler) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Link href="/traveler" className="inline-flex">
          <Button variant="ghost" size="icon" className="min-h-11 min-w-11">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-[var(--orange)]">
            {jobNumber}
          </p>
          <h1 className="text-lg font-semibold leading-snug line-clamp-2">
            {description}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="font-mono text-sm">
              TRV-{traveler.poNumber}
              {traveler.version > 1 ? `_v${traveler.version}` : ""}
            </p>
            <Badge variant="secondary">{traveler.status}</Badge>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Tap Sign off on each floor step. Pick your name and PIN — even on a
        shared station tablet.
      </p>

      <ul className="space-y-4">
        {traveler.lines.map((line) => (
          <li key={line.id} className="rounded-xl border bg-card p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground font-mono">
                Line {line.lineNumber ?? "—"} · Qty {line.quantity}
              </p>
              <p className="font-mono font-semibold">{line.catalogId}</p>
              <p className="text-sm text-muted-foreground">
                {line.structureNumber ?? "—"} · {line.description ?? ""}
              </p>
            </div>
            <FloorLineChecklist jobId={jobId} line={line} canSignOff />
          </li>
        ))}
      </ul>
    </div>
  )
}
