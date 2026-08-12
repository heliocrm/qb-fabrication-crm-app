"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  combinePdfs,
  createPacketSettings,
  cropFromTemplate,
  cropToProportions,
  normalizePdf,
  pageRegion,
  removePageSettings,
  resetPageSettings,
  stampAndRotate,
  STAMP_MARGIN,
  type PacketSettings,
  type Rect,
} from "@/lib/drawing-packet/stamp-engine"
import {
  deleteCropTemplateAction,
  listCropTemplatesAction,
  saveCropTemplateAction,
  saveDrawingPacketAction,
} from "@/lib/actions/drawing-packets"
import type { DrawingCropTemplateRow } from "@/lib/supabase/services/drawing-packets"
import { PDFDocument } from "pdf-lib"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  poNumber: string
  revNumber: string
  orderDate: string
}

async function loadSignatureBytes(): Promise<Uint8Array | null> {
  try {
    const res = await fetch("/travelers/signature.png")
    if (!res.ok) return null
    return new Uint8Array(await res.arrayBuffer())
  } catch {
    return null
  }
}

async function renderPagePreview(
  pdfBytes: Uint8Array,
  pageIndex: number,
  zoom: number
): Promise<string> {
  const pdfjs = await import("pdfjs-dist")
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
  }
  const doc = await pdfjs.getDocument({ data: pdfBytes.slice() }).promise
  try {
    const page = await doc.getPage(pageIndex + 1)
    const viewport = page.getViewport({ scale: zoom })
    const canvas = document.createElement("canvas")
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas unavailable")
    await page.render({ canvasContext: ctx, viewport, canvas }).promise
    return canvas.toDataURL("image/png")
  } finally {
    ;(doc as { destroy?: () => void }).destroy?.()
  }
}

export function DrawingPacketStudio({
  open,
  onOpenChange,
  jobId,
  poNumber,
  revNumber,
  orderDate,
}: Props) {
  const [sourceBytes, setSourceBytes] = useState<Uint8Array | null>(null)
  const [pageSizes, setPageSizes] = useState<Rect[]>([])
  const [settings, setSettings] = useState<PacketSettings | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [zoom, setZoom] = useState(0.75)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cropMode, setCropMode] = useState(false)
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [templates, setTemplates] = useState<DrawingCropTemplateRow[]>([])
  const [templateName, setTemplateName] = useState("")
  const [fileNames, setFileNames] = useState<string[]>([])
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const [cropDraft, setCropDraft] = useState<Rect | null>(null)
  const outputRef = useRef<Uint8Array | null>(null)

  const loadTemplates = useCallback(async () => {
    const res = await listCropTemplatesAction()
    if (res.data) {
      setTemplates(res.data)
      if (res.data[0] && !templateName) setTemplateName(res.data[0].name)
    }
  }, [templateName])

  useEffect(() => {
    if (open) void loadTemplates()
  }, [open, loadTemplates])

  async function rebuildPreview(
    bytes: Uint8Array,
    nextSettings: PacketSettings,
    index: number,
    nextZoom: number
  ) {
    setBusy(true)
    try {
      const sig = await loadSignatureBytes()
      const stamped = await stampAndRotate(
        bytes,
        revNumber || "0",
        orderDate || "N/A",
        nextSettings,
        sig
      )
      outputRef.current = stamped
      const url = await renderPagePreview(stamped, index, nextZoom)
      setPreviewUrl(url)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Preview failed")
    } finally {
      setBusy(false)
    }
  }

  async function onPickFiles(files: FileList | null) {
    if (!files?.length) return
    const list = Array.from(files)
    setFileNames(list.map((f) => f.name))
    setBusy(true)
    try {
      const buffers = await Promise.all(list.map((f) => f.arrayBuffer()))
      let combined = await combinePdfs(buffers)
      combined = await normalizePdf(combined)
      const doc = await PDFDocument.load(combined)
      const sizes: Rect[] = doc.getPages().map((p) => {
        const { width, height } = p.getSize()
        return { x0: 0, y0: 0, x1: width, y1: height }
      })
      const ps = createPacketSettings(sizes.length)
      setSourceBytes(combined)
      setPageSizes(sizes)
      setSettings(ps)
      setPageIndex(0)
      await rebuildPreview(combined, ps, 0, zoom)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load drawings")
    } finally {
      setBusy(false)
    }
  }

  function updateSettings(mutator: (ps: PacketSettings) => void) {
    if (!settings || !sourceBytes) return
    const next = structuredClone(settings) as PacketSettings
    mutator(next)
    setSettings(next)
    void rebuildPreview(sourceBytes, next, pageIndex, zoom)
  }

  const pageLabel = useMemo(() => {
    if (!settings) return ""
    const rot = settings.finalRotation[pageIndex] ?? 0
    return `Page ${pageIndex + 1} of ${settings.totalPages}  |  Zoom ${Math.round(zoom * 100)}%  |  Page rotation: ${rot}°`
  }, [settings, pageIndex, zoom])

  function onCanvasPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!settings || !sourceBytes || !pageSizes[pageIndex]) return
    const rect = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - rect.left) / zoom
    const dy = (e.clientY - rect.top) / zoom
    if (cropMode) {
      dragStart.current = { x: dx, y: dy }
      setCropDraft({ x0: dx, y0: dy, x1: dx, y1: dy })
      return
    }
    updateSettings((ps) => {
      ps.positions[pageIndex] = { x: dx, y: dy }
    })
  }

  function onCanvasPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!cropMode || !dragStart.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - rect.left) / zoom
    const dy = (e.clientY - rect.top) / zoom
    setCropDraft({
      x0: Math.min(dragStart.current.x, dx),
      y0: Math.min(dragStart.current.y, dy),
      x1: Math.max(dragStart.current.x, dx),
      y1: Math.max(dragStart.current.y, dy),
    })
  }

  function onCanvasPointerUp() {
    if (!cropMode || !cropDraft || !settings) {
      dragStart.current = null
      return
    }
    const page = pageSizes[pageIndex]
    if (!page) return
    updateSettings((ps) => {
      ps.crops[pageIndex] = cropDraft
      ps.positions[pageIndex] = null
    })
    setCropMode(false)
    setCropDraft(null)
    dragStart.current = null
  }

  function downloadOutput() {
    const bytes = outputRef.current
    if (!bytes) {
      toast.error("Nothing to download yet")
      return
    }
    const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `TRV-${poNumber || "packet"}_DRAWINGS.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  function saveToDrive() {
    const bytes = outputRef.current
    if (!bytes) {
      toast.error("Generate a preview first")
      return
    }
    startTransition(async () => {
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" })
      const file = new File(
        [blob],
        `TRV-${poNumber || "packet"}_DRAWINGS.pdf`,
        { type: "application/pdf" }
      )
      const fd = new FormData()
      fd.set("file", file)
      fd.set("documentType", "Drawing Packet")
      fd.set("pageCount", String(settings?.totalPages ?? 0))
      fd.set("revNumber", revNumber)
      fd.set("poNumber", poNumber)
      const res = await saveDrawingPacketAction(jobId, fd)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success("Drawing packet saved to Drive")
    })
  }

  function applyTemplateToPage(all: boolean) {
    const tpl = templates.find((t) => t.name === templateName)
    if (!tpl || !settings) return
    updateSettings((ps) => {
      const targets = all
        ? Array.from({ length: ps.totalPages }, (_, i) => i)
        : [pageIndex]
      for (const i of targets) {
        const page = pageSizes[i]
        if (!page) continue
        ps.crops[i] = cropFromTemplate(
          {
            crop: tpl.crop,
            marginSide: tpl.marginSide,
            marginLeft: tpl.marginLeft,
            marginRight: tpl.marginRight,
          },
          page
        )
        ps.marginSide[i] = tpl.marginSide
        ps.marginLeft[i] = tpl.marginLeft
        ps.marginRight[i] = tpl.marginRight
        ps.positions[i] = null
      }
    })
  }

  function saveCurrentAsTemplate() {
    if (!settings || !pageSizes[pageIndex]) return
    const crop = settings.crops[pageIndex]
    if (!crop) {
      toast.error("Crop this page first, then save as a template")
      return
    }
    const name = window.prompt("Template name:")
    if (!name?.trim()) return
    startTransition(async () => {
      const data = {
        crop: cropToProportions(crop, pageSizes[pageIndex]!),
        marginSide: settings.marginSide[pageIndex] ?? "left",
        marginLeft: settings.marginLeft[pageIndex] ?? STAMP_MARGIN,
        marginRight: settings.marginRight[pageIndex] ?? STAMP_MARGIN,
      }
      const res = await saveCropTemplateAction(name.trim(), data)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(`Saved template "${name.trim()}"`)
      setTemplateName(name.trim())
      await loadTemplates()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Drawing packet — stamp &amp; rotate</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="file"
              accept="application/pdf"
              multiple
              className="max-w-md"
              onChange={(e) => void onPickFiles(e.target.files)}
            />
            {fileNames.length ? (
              <span className="text-muted-foreground truncate">
                {fileNames.length} file(s): {fileNames.join(", ")}
              </span>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">
            Drag to place the stamp. Crop Page then drag = area to keep. Rev{" "}
            {revNumber || "0"} · Date {orderDate || "N/A"}
          </p>

          {pageLabel ? (
            <p className="font-mono text-xs text-muted-foreground">{pageLabel}</p>
          ) : null}

          <div
            className="relative overflow-auto border rounded-md bg-muted/30 min-h-[240px] max-h-[50vh]"
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Stamped preview"
                className="select-none max-w-none"
                draggable={false}
              />
            ) : (
              <p className="p-8 text-center text-muted-foreground">
                Select drawing PDFs to begin
              </p>
            )}
            {cropDraft ? (
              <div
                className="absolute border-2 border-[var(--orange)] bg-[var(--orange)]/10 pointer-events-none"
                style={{
                  left: cropDraft.x0 * zoom,
                  top: cropDraft.y0 * zoom,
                  width: (cropDraft.x1 - cropDraft.x0) * zoom,
                  height: (cropDraft.y1 - cropDraft.y0) * zoom,
                }}
              />
            ) : null}
          </div>

          <div className="grid gap-2">
            <Row label="VIEW / STAMP">
              <Btn
                disabled={!settings || pageIndex <= 0}
                onClick={() => {
                  const i = Math.max(0, pageIndex - 1)
                  setPageIndex(i)
                  if (sourceBytes && settings)
                    void rebuildPreview(sourceBytes, settings, i, zoom)
                }}
              >
                Prev
              </Btn>
              <Btn
                disabled={!settings || pageIndex >= (settings?.totalPages ?? 1) - 1}
                onClick={() => {
                  const i = Math.min((settings?.totalPages ?? 1) - 1, pageIndex + 1)
                  setPageIndex(i)
                  if (sourceBytes && settings)
                    void rebuildPreview(sourceBytes, settings, i, zoom)
                }}
              >
                Next
              </Btn>
              <Btn
                onClick={() => {
                  const z = Math.max(0.25, zoom - 0.15)
                  setZoom(z)
                  if (sourceBytes && settings)
                    void rebuildPreview(sourceBytes, settings, pageIndex, z)
                }}
              >
                Zoom -
              </Btn>
              <Btn
                onClick={() => {
                  const z = Math.min(2.5, zoom + 0.15)
                  setZoom(z)
                  if (sourceBytes && settings)
                    void rebuildPreview(sourceBytes, settings, pageIndex, z)
                }}
              >
                Zoom +
              </Btn>
              <Btn
                onClick={() =>
                  updateSettings((ps) => {
                    ps.sizes[pageIndex] = Math.max(8, (ps.sizes[pageIndex] ?? 20) - 2)
                  })
                }
              >
                Stamp smaller
              </Btn>
              <Btn
                onClick={() =>
                  updateSettings((ps) => {
                    ps.sizes[pageIndex] = Math.min(48, (ps.sizes[pageIndex] ?? 20) + 2)
                  })
                }
              >
                Stamp bigger
              </Btn>
              <Btn
                onClick={() =>
                  updateSettings((ps) => {
                    ps.stampRotations[pageIndex] =
                      ((ps.stampRotations[pageIndex] ?? 90) + 90) % 360
                  })
                }
              >
                Rotate stamp
              </Btn>
              <Btn
                onClick={() => {
                  if (!window.confirm("Copy this page stamp size/rotation/position to ALL pages?"))
                    return
                  updateSettings((ps) => {
                    const size = ps.sizes[pageIndex]
                    const rot = ps.stampRotations[pageIndex]
                    const pos = ps.positions[pageIndex]
                    const region = pageRegion(ps, pageIndex, pageSizes[pageIndex]!)
                    for (let j = 0; j < ps.totalPages; j++) {
                      ps.sizes[j] = size
                      ps.stampRotations[j] = rot
                      if (pos && pageSizes[j]) {
                        const rj = pageRegion(ps, j, pageSizes[j]!)
                        ps.positions[j] = {
                          x: rj.x0 + ((pos.x - region.x0) / (region.x1 - region.x0 || 1)) * (rj.x1 - rj.x0),
                          y: rj.y0 + ((pos.y - region.y0) / (region.y1 - region.y0 || 1)) * (rj.y1 - rj.y0),
                        }
                      }
                    }
                  })
                }}
              >
                Stamp → All
              </Btn>
              <Btn onClick={downloadOutput}>Open / download PDF</Btn>
            </Row>

            <Row label="CROP">
              <Btn
                variant={cropMode ? "default" : "outline"}
                onClick={() => setCropMode((v) => !v)}
              >
                Crop page
              </Btn>
              <Btn
                onClick={() =>
                  updateSettings((ps) => {
                    ps.crops[pageIndex] = null
                    ps.positions[pageIndex] = null
                  })
                }
              >
                Reset crop
              </Btn>
              <select
                className="h-9 rounded-md border bg-background px-2 text-sm"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              >
                <option value="">Templates…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
              <Btn onClick={saveCurrentAsTemplate} disabled={pending}>
                Save
              </Btn>
              <Btn onClick={() => applyTemplateToPage(false)}>Apply</Btn>
              <Btn onClick={() => applyTemplateToPage(true)}>Apply → All</Btn>
              <Btn
                onClick={() => {
                  if (!templateName) return
                  if (!window.confirm(`Delete template "${templateName}"?`)) return
                  startTransition(async () => {
                    const res = await deleteCropTemplateAction(templateName)
                    if (res.error) toast.error(res.error)
                    else {
                      toast.success("Deleted")
                      await loadTemplates()
                    }
                  })
                }}
              >
                Delete
              </Btn>
            </Row>

            <Row label="MARGINS">
              <Btn
                onClick={() =>
                  updateSettings((ps) => {
                    ps.marginSide[pageIndex] = "left"
                    ps.positions[pageIndex] = null
                  })
                }
              >
                Stamp left
              </Btn>
              <Btn
                onClick={() =>
                  updateSettings((ps) => {
                    ps.marginSide[pageIndex] = "right"
                    ps.positions[pageIndex] = null
                  })
                }
              >
                Stamp right
              </Btn>
              <Btn
                onClick={() => {
                  if (!window.confirm("Put stamp margin side on ALL pages?")) return
                  updateSettings((ps) => {
                    const side = ps.marginSide[pageIndex]
                    for (let j = 0; j < ps.totalPages; j++) ps.marginSide[j] = side
                  })
                }}
              >
                Side → All
              </Btn>
              <Btn
                onClick={() =>
                  updateSettings((ps) => {
                    ps.marginLeft[pageIndex] = Math.min(
                      200,
                      (ps.marginLeft[pageIndex] ?? STAMP_MARGIN) + 8
                    )
                    ps.positions[pageIndex] = null
                  })
                }
              >
                Left +
              </Btn>
              <Btn
                onClick={() =>
                  updateSettings((ps) => {
                    ps.marginLeft[pageIndex] = Math.max(
                      8,
                      (ps.marginLeft[pageIndex] ?? STAMP_MARGIN) - 8
                    )
                    ps.positions[pageIndex] = null
                  })
                }
              >
                Left -
              </Btn>
              <Btn
                onClick={() =>
                  updateSettings((ps) => {
                    ps.marginRight[pageIndex] = Math.min(
                      200,
                      (ps.marginRight[pageIndex] ?? STAMP_MARGIN) + 8
                    )
                    ps.positions[pageIndex] = null
                  })
                }
              >
                Right +
              </Btn>
              <Btn
                onClick={() =>
                  updateSettings((ps) => {
                    ps.marginRight[pageIndex] = Math.max(
                      8,
                      (ps.marginRight[pageIndex] ?? STAMP_MARGIN) - 8
                    )
                    ps.positions[pageIndex] = null
                  })
                }
              >
                Right -
              </Btn>
              <Btn
                onClick={() => {
                  if (!window.confirm("Apply margin widths to ALL pages?")) return
                  updateSettings((ps) => {
                    const lw = ps.marginLeft[pageIndex]
                    const rw = ps.marginRight[pageIndex]
                    for (let j = 0; j < ps.totalPages; j++) {
                      ps.marginLeft[j] = lw
                      ps.marginRight[j] = rw
                      ps.positions[j] = null
                    }
                  })
                }}
              >
                Widths → All
              </Btn>
            </Row>

            <Row label="PAGE">
              <Btn
                onClick={() =>
                  updateSettings((ps) => {
                    ps.finalRotation[pageIndex] =
                      ((ps.finalRotation[pageIndex] ?? 0) - 90 + 360) % 360
                  })
                }
              >
                Rotate L
              </Btn>
              <Btn
                onClick={() =>
                  updateSettings((ps) => {
                    ps.finalRotation[pageIndex] =
                      ((ps.finalRotation[pageIndex] ?? 0) + 90) % 360
                  })
                }
              >
                Rotate R
              </Btn>
              <Btn
                onClick={() =>
                  updateSettings((ps) => {
                    ps.finalRotation[pageIndex] =
                      ((ps.finalRotation[pageIndex] ?? 0) + 180) % 360
                  })
                }
              >
                Rotate 180
              </Btn>
              <Btn
                onClick={() =>
                  updateSettings((ps) => {
                    ps.finalRotation[pageIndex] = 0
                  })
                }
              >
                Reset rotation
              </Btn>
              <Btn
                onClick={() => {
                  if (
                    !window.confirm(
                      `Rotate ALL pages to ${settings?.finalRotation[pageIndex] ?? 0}°?`
                    )
                  )
                    return
                  updateSettings((ps) => {
                    const angle = ps.finalRotation[pageIndex] ?? 0
                    for (let j = 0; j < ps.totalPages; j++) ps.finalRotation[j] = angle
                  })
                }}
              >
                Rotation → All
              </Btn>
              <Btn
                onClick={() =>
                  updateSettings((ps) => {
                    for (let j = 0; j < ps.totalPages; j++) ps.finalRotation[j] = 0
                  })
                }
              >
                Reset all rotations
              </Btn>
              <Btn
                onClick={() =>
                  updateSettings((ps) => {
                    resetPageSettings(ps, pageIndex)
                  })
                }
              >
                Reset this page
              </Btn>
              <Btn
                onClick={() => {
                  if (!settings || settings.totalPages <= 1) {
                    toast.error("Cannot remove the only page")
                    return
                  }
                  if (!window.confirm(`Remove page ${pageIndex + 1}?`)) return
                  // Rebuild source without this page
                  void (async () => {
                    if (!sourceBytes || !settings) return
                    const doc = await PDFDocument.load(sourceBytes)
                    const out = await PDFDocument.create()
                    const keep = doc
                      .getPageIndices()
                      .filter((i) => i !== pageIndex)
                    const pages = await out.copyPages(doc, keep)
                    pages.forEach((p) => out.addPage(p))
                    const nextBytes = await out.save()
                    const nextSettings = structuredClone(settings) as PacketSettings
                    removePageSettings(nextSettings, pageIndex)
                    const sizes: Rect[] = out.getPages().map((p) => {
                      const { width, height } = p.getSize()
                      return { x0: 0, y0: 0, x1: width, y1: height }
                    })
                    const nextIndex = Math.min(pageIndex, nextSettings.totalPages - 1)
                    setSourceBytes(nextBytes)
                    setSettings(nextSettings)
                    setPageSizes(sizes)
                    setPageIndex(nextIndex)
                    await rebuildPreview(nextBytes, nextSettings, nextIndex, zoom)
                  })()
                }}
              >
                Remove page
              </Btn>
            </Row>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                onClick={saveToDrive}
                disabled={pending || busy || !outputRef.current}
              >
                Save to Drive
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              {busy ? (
                <span className="text-xs text-muted-foreground self-center">
                  Working…
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-24 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  )
}

function Btn({
  children,
  onClick,
  disabled,
  variant = "outline",
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: "outline" | "default"
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      className="h-8 px-2 text-xs"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
