"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Download,
  FileStack,
  Loader2,
  Printer,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FloorLineChecklist } from "@/components/floor/floor-line-checklist"
import { DrawingPacketStudio } from "@/components/drawing-packet/drawing-packet-studio"
import {
  downloadTravelerDocxAction,
  getActiveTravelerAction,
} from "@/lib/actions/travelers"
import type { Traveler } from "@/types"

function downloadBase64Docx(filename: string, base64: string) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

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
  const [pending, startTransition] = useTransition()
  const [packetOpen, setPacketOpen] = useState(false)

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

  function downloadDocx() {
    startTransition(async () => {
      const res = await downloadTravelerDocxAction(jobId)
      if (res.error || !res.data) {
        toast.error(res.error ?? "Download failed")
        return
      }
      downloadBase64Docx(res.data.filename, res.data.base64)
      toast.success(`Downloaded ${res.data.filename}`)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Link href="/traveler" className="inline-flex">
          <Button variant="ghost" size="icon" className="min-h-11 min-w-11">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
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

      <div className="flex flex-wrap gap-2">
        <Link href={`/traveler/jobs/${jobId}/print`} className="inline-flex">
          <Button variant="outline" size="sm" className="min-h-11 gap-1.5">
            <Printer className="size-4" />
            Print
          </Button>
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 gap-1.5"
          disabled={pending}
          onClick={downloadDocx}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Download DOCX
        </Button>
        <Button
          type="button"
          size="sm"
          className="min-h-11 gap-1.5"
          onClick={() => setPacketOpen(true)}
        >
          <FileStack className="size-4" />
          Drawing packet
        </Button>
      </div>

      <DrawingPacketStudio
        open={packetOpen}
        onOpenChange={setPacketOpen}
        jobId={jobId}
        poNumber={traveler.poNumber}
        revNumber={traveler.revNumber ?? "0"}
        orderDate={traveler.orderDate ?? ""}
      />

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
