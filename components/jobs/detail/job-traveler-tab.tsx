"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import Link from "next/link"
import {
  Download,
  FileStack,
  Loader2,
  Mail,
  Printer,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  downloadTravelerDocxAction,
  emailTravelerAction,
  getActiveTravelerAction,
  updateTravelerLineAction,
} from "@/lib/actions/travelers"
import { FloorLineChecklist } from "@/components/floor/floor-line-checklist"
import { DrawingPacketStudio } from "@/components/drawing-packet/drawing-packet-studio"
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

export function JobTravelerTab({
  jobId,
  canWrite = true,
  canSignOff = true,
  onImport,
  refreshKey = 0,
}: {
  jobId: string
  canWrite?: boolean
  canSignOff?: boolean
  onImport?: () => void
  refreshKey?: number
}) {
  const [traveler, setTraveler] = useState<Traveler | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, startTransition] = useTransition()
  const [emailTo, setEmailTo] = useState("")
  const [showEmail, setShowEmail] = useState(false)
  const [packetOpen, setPacketOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await getActiveTravelerAction(jobId)
    if (res.error) {
      toast.error(res.error)
      setTraveler(null)
    } else {
      setTraveler(res.data ?? null)
    }
    setLoading(false)
  }, [jobId])

  useEffect(() => {
    void load()
  }, [load, refreshKey])

  function saveLine(
    lineId: string,
    patch: { structureNumber?: string; description?: string }
  ) {
    startTransition(async () => {
      const res = await updateTravelerLineAction(jobId, lineId, patch)
      if (res.error) {
        toast.error(res.error)
        return
      }
      setTraveler((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          lines: prev.lines.map((l) =>
            l.id === lineId ? { ...l, ...res.data!.line } : l
          ),
        }
      })
      toast.success("Line updated")
    })
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

  function sendEmail() {
    startTransition(async () => {
      const res = await emailTravelerAction(jobId, emailTo)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success("Traveler email sent")
      setShowEmail(false)
      setEmailTo("")
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading traveler…
      </div>
    )
  }

  if (!traveler) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="flex flex-col items-start gap-4 py-8">
          <div>
            <p className="font-medium">No digital traveler yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Import a QB work order PDF to create the in-system traveler and
              seed linked production line items.
            </p>
          </div>
          {canWrite && onImport ? (
            <Button type="button" onClick={onImport} className="min-h-11">
              Import work order
            </Button>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold font-mono">
              TRV-{traveler.poNumber}
              {traveler.version > 1 ? `_v${traveler.version}` : ""}
            </h2>
            <Badge variant="secondary">{traveler.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Imported {new Date(traveler.importedAt).toLocaleString()} ·{" "}
            {traveler.lines.length} lines
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-10 gap-1.5"
            onClick={() => void load()}
            disabled={pending}
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
          <Link
            href={`/jobs/${jobId}/traveler/print`}
            target="_blank"
            className="inline-flex"
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-10 gap-1.5"
            >
              <Printer className="size-3.5" />
              Print
            </Button>
          </Link>
          {canWrite ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10 gap-1.5"
                onClick={() => setShowEmail((v) => !v)}
                disabled={pending}
              >
                <Mail className="size-3.5" />
                Email
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10 gap-1.5"
                onClick={downloadDocx}
                disabled={pending}
              >
                {pending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                DOCX
              </Button>
              <Button
                type="button"
                size="sm"
                className="min-h-10 gap-1.5"
                onClick={() => setPacketOpen(true)}
              >
                <FileStack className="size-3.5" />
                Drawing packet
              </Button>
              {onImport ? (
                <Button
                  type="button"
                  size="sm"
                  className="min-h-10"
                  onClick={onImport}
                >
                  Re-import
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <DrawingPacketStudio
        open={packetOpen}
        onOpenChange={setPacketOpen}
        jobId={jobId}
        poNumber={traveler.poNumber}
        revNumber={traveler.revNumber ?? "0"}
        orderDate={traveler.orderDate ?? ""}
      />

      {showEmail ? (
        <Card className="border shadow-sm">
          <CardContent className="flex flex-col sm:flex-row gap-2 py-3">
            <Input
              type="email"
              placeholder="name@example.com"
              className="min-h-11"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
            />
            <Button
              type="button"
              className="min-h-11 shrink-0"
              onClick={sendEmail}
              disabled={pending || !emailTo.trim()}
            >
              Send link
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Header</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 text-sm">
          <p>
            <span className="text-muted-foreground">Customer · </span>
            {traveler.customer ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">PO · </span>
            <span className="font-mono">{traveler.poNumber}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Order date · </span>
            {traveler.orderDate ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Ship date · </span>
            {traveler.shipDate ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Rev · </span>
            {traveler.revNumber ?? "0"}
          </p>
          <p>
            <span className="text-muted-foreground">QB SO · </span>
            {traveler.qbSalesOrder ?? "—"}
          </p>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Lines ({traveler.lines.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {traveler.lines.map((line) => (
            <div
              key={line.id}
              className="rounded-lg border p-3 space-y-2 bg-card"
            >
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="font-mono">
                  Line {line.lineNumber ?? "—"} · Qty {line.quantity}
                </span>
                {line.lineItemId ? (
                  <Badge variant="outline" className="text-[10px]">
                    Linked to production
                  </Badge>
                ) : null}
              </div>
              <p className="font-mono text-sm font-medium">{line.catalogId}</p>
              {canWrite ? (
                <>
                  <Input
                    className="min-h-10 text-sm"
                    defaultValue={line.description ?? ""}
                    onBlur={(e) => {
                      if (e.target.value !== (line.description ?? "")) {
                        saveLine(line.id, { description: e.target.value })
                      }
                    }}
                  />
                  <div className="space-y-1">
                    <span className="text-xs font-medium">Structure #</span>
                    <Input
                      className="min-h-10 text-sm"
                      defaultValue={line.structureNumber ?? ""}
                      onBlur={(e) => {
                        if (e.target.value !== (line.structureNumber ?? "")) {
                          saveLine(line.id, {
                            structureNumber: e.target.value,
                          })
                        }
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm">{line.description ?? "—"}</p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Structure · </span>
                    {line.structureNumber ?? "—"}
                  </p>
                </>
              )}
              <FloorLineChecklist
                jobId={jobId}
                line={line}
                canSignOff={canSignOff}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
