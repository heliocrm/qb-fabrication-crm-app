"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { ArrowLeft, FileUp, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  importTravelerAction,
  listDigitalTravelersAction,
  parseWorkOrderAction,
} from "@/lib/actions/travelers"
import type { TravelerCatalogItem } from "@/lib/travelers/types"
import type { Traveler } from "@/types"
import { cn } from "@/lib/utils"

type Step = "upload" | "review" | "done"

export function TravelerJobFlow({
  jobId,
  jobNumber,
  poNumber,
  description,
  variant = "pwa",
  onClose,
  onGenerated,
}: {
  jobId: string
  jobNumber: string
  poNumber: string
  description: string
  variant?: "pwa" | "crm"
  onClose?: () => void
  onGenerated?: () => void
}) {
  const isCrm = variant === "crm"
  const [step, setStep] = useState<Step>("upload")
  const [pending, startTransition] = useTransition()
  const [fileName, setFileName] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [customer, setCustomer] = useState("")
  const [customerPo, setCustomerPo] = useState(poNumber)
  const [orderDate, setOrderDate] = useState("")
  const [revNumber, setRevNumber] = useState("0")
  const [qbSalesOrder, setQbSalesOrder] = useState("")
  const [shipDate, setShipDate] = useState("")
  const [items, setItems] = useState<TravelerCatalogItem[]>([])
  const [history, setHistory] = useState<Traveler[]>([])
  const [imported, setImported] = useState<Traveler | null>(null)

  useEffect(() => {
    void listDigitalTravelersAction(jobId).then((res) => {
      if (res.data) setHistory(res.data)
    })
  }, [jobId])

  // Revoke blob URL when it changes or on unmount.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function setPreviewFromFile(file: File) {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  function clearPreview() {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setFileName(null)
  }

  function onFileChange(file: File | null) {
    if (!file) return
    setFileName(file.name)
    setPreviewFromFile(file)
    const fd = new FormData()
    fd.set("file", file)
    startTransition(async () => {
      const res = await parseWorkOrderAction(jobId, fd)
      if (res.error || !res.data) {
        toast.error(res.error ?? "Could not parse work order")
        return
      }
      setCustomer(res.data.customer)
      setCustomerPo(
        res.data.customerPo !== "N/A" ? res.data.customerPo : poNumber
      )
      setOrderDate(res.data.orderDate)
      setQbSalesOrder(res.data.qbSalesOrder ?? "")
      setShipDate(res.data.shipDate ?? "")
      setRevNumber("0")
      setItems(
        res.data.catalogItems.length
          ? res.data.catalogItems
          : [
              {
                catalogId: "",
                description: "",
                structureNumber: "",
                quantity: 1,
              },
            ]
      )
      setStep("review")
      toast.success("Work order parsed — confirm fields against the PDF")
    })
  }

  function fillNa() {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        structureNumber: item.structureNumber.trim()
          ? item.structureNumber
          : "N/A",
      }))
    )
  }

  function addLine() {
    setItems((prev) => [
      ...prev,
      {
        catalogId: "",
        description: "",
        structureNumber: "",
        quantity: 1,
        lineNumber: String(prev.length + 1),
      },
    ])
  }

  function updateItem(index: number, patch: Partial<TravelerCatalogItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    )
  }

  function importTraveler() {
    startTransition(async () => {
      const res = await importTravelerAction(jobId, {
        customer,
        customerPo,
        orderDate,
        revNumber,
        qbSalesOrder: qbSalesOrder || undefined,
        shipDate: shipDate || undefined,
        catalogItems: items,
      })
      if (res.error || !res.data) {
        toast.error(res.error ?? "Import failed")
        return
      }
      setImported(res.data.traveler)
      setHistory((prev) => [res.data!.traveler, ...prev])
      setStep("done")
      onGenerated?.()
      toast.success(
        `Imported traveler v${res.data.traveler.version} · ${res.data.traveler.lines.length} lines`
      )
    })
  }

  const importButton = (
    <Button
      type="button"
      className="w-full min-h-12 text-base touch-manipulation"
      onClick={importTraveler}
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Importing…
        </>
      ) : (
        "Import traveler"
      )}
    </Button>
  )

  const previewPanel = (
    <div className="space-y-2 min-w-0">
      <p className="text-sm font-semibold">Work order preview</p>
      {previewUrl ? (
        <iframe
          title="Work order PDF"
          src={previewUrl}
          className="w-full h-[50vh] md:h-[70vh] rounded-md border bg-muted"
        />
      ) : (
        <p className="rounded-md border bg-muted/40 p-6 text-sm text-muted-foreground">
          PDF preview unavailable. Re-upload the work order to confirm fields.
        </p>
      )}
      {fileName ? (
        <p className="text-xs text-muted-foreground truncate">{fileName}</p>
      ) : null}
    </div>
  )

  const formPanel = (
    <div className="space-y-4 min-w-0">
      <div className="grid gap-3 rounded-lg border bg-card p-4">
        <div className="space-y-1.5">
          <label htmlFor="customer" className="text-sm font-medium">
            Customer
          </label>
          <Input
            id="customer"
            className="min-h-11 text-base"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            disabled={pending || step === "done"}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="po" className="text-sm font-medium">
              PO #
            </label>
            <Input
              id="po"
              className="min-h-11 text-base font-mono"
              value={customerPo}
              onChange={(e) => setCustomerPo(e.target.value)}
              disabled={pending || step === "done"}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="rev" className="text-sm font-medium">
              Rev #
            </label>
            <Input
              id="rev"
              className="min-h-11 text-base"
              value={revNumber}
              onChange={(e) => setRevNumber(e.target.value)}
              disabled={pending || step === "done"}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="orderDate" className="text-sm font-medium">
              Order date
            </label>
            <Input
              id="orderDate"
              className="min-h-11 text-base"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              disabled={pending || step === "done"}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="shipDate" className="text-sm font-medium">
              Ship date
            </label>
            <Input
              id="shipDate"
              className="min-h-11 text-base"
              value={shipDate}
              onChange={(e) => setShipDate(e.target.value)}
              disabled={pending || step === "done"}
            />
          </div>
        </div>
        {qbSalesOrder ? (
          <div className="space-y-1.5">
            <label htmlFor="qbSo" className="text-sm font-medium">
              QB Sales Order
            </label>
            <Input
              id="qbSo"
              className="min-h-11 text-base font-mono"
              value={qbSalesOrder}
              onChange={(e) => setQbSalesOrder(e.target.value)}
              disabled={pending || step === "done"}
            />
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Line items ({items.length})</h2>
        {step === "review" ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 touch-manipulation"
              onClick={fillNa}
              disabled={pending}
            >
              Fill N/A
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="min-h-11 min-w-11"
              onClick={addLine}
              disabled={pending}
              aria-label="Add line item"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>

      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={`${item.catalogId}-${item.lineNumber ?? index}-${index}`}
            className="rounded-lg border bg-card p-3 space-y-2"
          >
            <div className="grid grid-cols-2 gap-2">
              <Input
                className="min-h-11 text-base font-mono"
                placeholder="Line #"
                value={item.lineNumber ?? ""}
                onChange={(e) =>
                  updateItem(index, { lineNumber: e.target.value })
                }
                disabled={pending || step === "done"}
              />
              <Input
                className="min-h-11 text-base"
                placeholder="Qty"
                type="number"
                min={1}
                value={item.quantity ?? 1}
                onChange={(e) =>
                  updateItem(index, {
                    quantity: Number(e.target.value) || 1,
                  })
                }
                disabled={pending || step === "done"}
              />
            </div>
            <Input
              className="min-h-11 text-base font-mono"
              placeholder="Catalog ID"
              value={item.catalogId}
              onChange={(e) =>
                updateItem(index, { catalogId: e.target.value })
              }
              disabled={pending || step === "done"}
            />
            <Input
              className="min-h-11 text-base"
              placeholder="Description"
              value={item.description}
              onChange={(e) =>
                updateItem(index, { description: e.target.value })
              }
              disabled={pending || step === "done"}
            />
            <div className="space-y-1">
              <span className="text-xs font-medium">Structure #</span>
              <Input
                className="min-h-11 text-base"
                placeholder="Structure #"
                value={item.structureNumber}
                onChange={(e) =>
                  updateItem(index, { structureNumber: e.target.value })
                }
                disabled={pending || step === "done"}
              />
            </div>
          </li>
        ))}
      </ul>

      {step === "review" && !isCrm ? importButton : null}

      {step === "done" ? (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <p className="text-sm font-medium">
            Traveler saved in CRM
            {imported
              ? ` · v${imported.version} · ${imported.lines.length} lines`
              : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Production line items were created and linked. Print, email, or
            download DOCX from the Traveler tab anytime.
          </p>
          {!isCrm ? (
            <Link href={`/traveler/jobs/${jobId}/print`} className="block">
              <Button className="w-full min-h-12">Print traveler</Button>
            </Link>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="w-full min-h-11"
            onClick={() => {
              setStep("upload")
              clearPreview()
              setImported(null)
            }}
          >
            Import another PDF
          </Button>
          {isCrm && onClose ? (
            <Button
              type="button"
              className="w-full min-h-11"
              onClick={onClose}
            >
              Done
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )

  return (
    <div className={cn("space-y-5", isCrm && step === "review" && "pb-20")}>
      <div className="flex items-start gap-3">
        {!isCrm ? (
          <Link
            href="/traveler"
            aria-label="Back to jobs"
            className="inline-flex"
          >
            <Button variant="ghost" size="icon" className="min-h-11 min-w-11">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
        ) : null}
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-[var(--orange)]">
            {jobNumber}
          </p>
          <h1
            className={cn(
              "font-semibold leading-snug line-clamp-2",
              isCrm ? "text-base" : "text-lg"
            )}
          >
            {description}
          </h1>
        </div>
      </div>

      {step === "upload" ? (
        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-card p-8 min-h-40 touch-manipulation cursor-pointer active:bg-muted/40">
            <FileUp className="size-8 text-muted-foreground" />
            <span className="text-sm font-medium text-center">
              {pending ? "Parsing…" : "Add work order PDF"}
            </span>
            {fileName ? (
              <span className="text-xs text-muted-foreground truncate max-w-full">
                {fileName}
              </span>
            ) : null}
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={pending}
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
          {pending ? (
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Reading PDF…
            </p>
          ) : null}
          {isCrm && onClose ? (
            <Button
              type="button"
              variant="ghost"
              className="w-full min-h-11"
              onClick={onClose}
            >
              Skip for now
            </Button>
          ) : null}
        </div>
      ) : null}

      {step === "review" || step === "done" ? (
        <div className="grid gap-4 md:grid-cols-2 items-start">
          {/* Mobile: collapsible preview (default open). Desktop: always visible. */}
          <div className="min-w-0 md:contents">
            <details open className="md:hidden rounded-lg border bg-card p-3">
              <summary className="cursor-pointer text-sm font-semibold touch-manipulation min-h-11 flex items-center">
                Work order preview
                {fileName ? (
                  <span className="ml-2 font-normal text-muted-foreground truncate">
                    · {fileName}
                  </span>
                ) : null}
              </summary>
              <div className="pt-3">
                {previewUrl ? (
                  <iframe
                    title="Work order PDF"
                    src={previewUrl}
                    className="w-full h-[50vh] rounded-md border bg-muted"
                  />
                ) : (
                  <p className="rounded-md border bg-muted/40 p-6 text-sm text-muted-foreground">
                    PDF preview unavailable. Re-upload the work order to confirm
                    fields.
                  </p>
                )}
              </div>
            </details>
            <div className="hidden md:block">{previewPanel}</div>
          </div>
          {formPanel}
        </div>
      ) : null}

      {history.length > 0 ? (
        <div className="space-y-2 pt-2">
          <h2 className="text-sm font-semibold">Traveler versions</h2>
          <ul className="space-y-2">
            {history.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-mono truncate">
                    TRV-{g.poNumber}
                    {g.version > 1 ? `_v${g.version}` : ""}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {g.status}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(g.importedAt).toLocaleString()} ·{" "}
                    {g.lines.length} lines
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {isCrm && step === "review" ? (
        <div className="sticky bottom-0 -mx-1 border-t bg-popover/95 backdrop-blur px-1 pt-3 pb-1">
          {importButton}
        </div>
      ) : null}
    </div>
  )
}
