"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MaterialCatalogPicker } from "@/components/material-requests/material-catalog-picker"
import { createMaterialPullRequestAction } from "@/lib/actions/material-pull-requests"
import { MATERIAL_PULL_STAGES } from "@/lib/material-pull-config"
import { toast } from "@/lib/toast"

interface MaterialRequestFormProps {
  redirectTo?: string
  compact?: boolean
}

export function MaterialRequestForm({
  redirectTo = "/material-requests",
  compact = false,
}: MaterialRequestFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    const jobNumber = String(fd.get("jobNumber") ?? "").trim()
    const material = String(fd.get("material") ?? "").trim()
    const quantity = Number(fd.get("quantity"))
    const unit = String(fd.get("unit") ?? "ea").trim() || "ea"
    const neededBy = String(fd.get("neededBy") ?? "").trim() || null
    const stage = String(fd.get("stage") ?? "").trim() || null
    const notes = String(fd.get("notes") ?? "").trim() || null

    if (!jobNumber || !material || !(quantity > 0)) {
      toast.error("Missing fields", "Job #, material, and quantity are required.")
      return
    }

    setIsSubmitting(true)
    const result = await createMaterialPullRequestAction({
      jobNumber,
      material,
      quantity,
      unit,
      neededBy,
      stage,
      notes,
    })
    setIsSubmitting(false)

    if (result.error) {
      toast.error("Could not submit", result.error)
      return
    }

    toast.success("Request submitted", "Eric’s queue has been notified.")
    router.push(redirectTo)
    router.refresh()
  }

  const form = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="jobNumber" className="text-sm font-medium">
            Job #
          </label>
          <Input
            id="jobNumber"
            name="jobNumber"
            placeholder="QB-2025-041"
            required
            autoComplete="off"
            className="min-h-11 text-base md:text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="neededBy" className="text-sm font-medium">
            Needed by
          </label>
          <Input
            id="neededBy"
            name="neededBy"
            type="date"
            className="min-h-11 text-base md:text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="material" className="text-sm font-medium">
          Material
        </label>
        <MaterialCatalogPicker id="material" name="material" required />
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="quantity" className="text-sm font-medium">
            Qty
          </label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min={0.01}
            step="any"
            defaultValue={1}
            required
            className="min-h-11 text-base md:text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="unit" className="text-sm font-medium">
            Unit
          </label>
          <Input
            id="unit"
            name="unit"
            defaultValue="ea"
            placeholder="ea"
            className="min-h-11 text-base md:text-sm"
          />
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label htmlFor="stage" className="text-sm font-medium">
            Stage
          </label>
          <select
            id="stage"
            name="stage"
            className="flex min-h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base md:text-sm shadow-xs"
            defaultValue="Fabrication"
          >
            {MATERIAL_PULL_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base md:text-sm shadow-xs resize-y min-h-[80px]"
          placeholder="Special instructions, location, heat preference…"
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full min-h-11 touch-manipulation sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Submitting…
          </>
        ) : (
          "Submit request"
        )}
      </Button>
    </form>
  )

  if (compact) return form

  return (
    <Card>
      <CardHeader>
        <CardTitle>New material pull request</CardTitle>
        <CardDescription>
          Submit to the Eric queue. Tristan pulls from the batched list.
        </CardDescription>
      </CardHeader>
      <CardContent>{form}</CardContent>
    </Card>
  )
}
