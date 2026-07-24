"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { ArrowLeft, FileUp, Loader2, Plus, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  generateTravelerAction,
  listTravelerGenerationsAction,
  parseWorkOrderAction,
} from "@/lib/actions/travelers"
import type {
  TravelerCatalogItem,
  TravelerGeneration,
} from "@/lib/travelers/types"

type Step = "upload" | "review" | "done"

export function TravelerJobFlow({
  jobId,
  jobNumber,
  poNumber,
  description,
}: {
  jobId: string
  jobNumber: string
  poNumber: string
  description: string
}) {
  const [step, setStep] = useState<Step>("upload")
  const [pending, startTransition] = useTransition()
  const [fileName, setFileName] = useState<string | null>(null)
  const [customer, setCustomer] = useState("")
  const [customerPo, setCustomerPo] = useState(poNumber)
  const [orderDate, setOrderDate] = useState("")
  const [revNumber, setRevNumber] = useState("0")
  const [items, setItems] = useState<TravelerCatalogItem[]>([])
  const [history, setHistory] = useState<TravelerGeneration[]>([])
  const [resultLink, setResultLink] = useState<string | null>(null)
  const [resultName, setResultName] = useState<string | null>(null)

  useEffect(() => {
    void listTravelerGenerationsAction(jobId).then((res) => {
      if (res.data) setHistory(res.data)
    })
  }, [jobId])

  function onFileChange(file: File | null) {
    if (!file) return
    setFileName(file.name)
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
      setRevNumber("0")
      setItems(
        res.data.catalogItems.length
          ? res.data.catalogItems
          : [
              {
                catalogId: "",
                description: "",
                structureNumber: "",
              },
            ]
      )
      setStep("review")
      toast.success("Work order parsed — review Structure #s")
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
      { catalogId: "", description: "", structureNumber: "" },
    ])
  }

  function updateItem(
    index: number,
    patch: Partial<TravelerCatalogItem>
  ) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    )
  }

  function generate() {
    startTransition(async () => {
      const res = await generateTravelerAction(jobId, {
        customer,
        customerPo,
        orderDate,
        revNumber,
        catalogItems: items,
      })
      if (res.error || !res.data) {
        toast.error(res.error ?? "Generate failed")
        return
      }
      setResultLink(res.data.webViewLink)
      setResultName(res.data.filename)
      setHistory((prev) => [res.data!.generation, ...prev])
      setStep("done")
      toast.success(`Created ${res.data.filename}`)
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Link
          href="/traveler"
          aria-label="Back to jobs"
          className="inline-flex"
        >
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
        </div>
      ) : null}

      {step === "review" || step === "done" ? (
        <div className="space-y-4">
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
          </div>

          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Line items</h2>
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
                key={`${item.catalogId}-${index}`}
                className="rounded-lg border bg-card p-3 space-y-2"
              >
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

          {step === "review" ? (
            <Button
              type="button"
              className="w-full min-h-12 text-base touch-manipulation"
              onClick={generate}
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Generating…
                </>
              ) : (
                "Generate traveler"
              )}
            </Button>
          ) : null}

          {step === "done" ? (
            <div className="space-y-3 rounded-lg border bg-card p-4">
              <p className="text-sm font-medium">
                {resultName ?? "Traveler"} ready
              </p>
              {resultLink ? (
                <a
                  href={resultLink}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <Button className="w-full min-h-12">
                    <ExternalLink className="size-4" />
                    Open in Drive
                  </Button>
                </a>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="w-full min-h-11"
                onClick={() => {
                  setStep("upload")
                  setFileName(null)
                  setResultLink(null)
                  setResultName(null)
                }}
              >
                New from another PDF
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {history.length > 0 ? (
        <div className="space-y-2 pt-2">
          <h2 className="text-sm font-semibold">Previous versions</h2>
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
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(g.generatedAt).toLocaleString()}
                  </p>
                </div>
                {g.webViewLink ? (
                  <a
                    href={g.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex"
                  >
                    <Button variant="ghost" size="sm" className="min-h-10">
                      Open
                    </Button>
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
