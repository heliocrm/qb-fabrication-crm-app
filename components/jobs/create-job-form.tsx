"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createJobFromTemplateAction, listOrgUsersForPickerAction } from "@/lib/actions/jobs"
import { JOB_TEMPLATE_OPTIONS } from "@/lib/job-templates"
import { resolveAccountId } from "@/lib/seed-ids"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Account, JobTemplateType, ProfileSummary } from "@/types"

interface ExtraLineItem {
  key: string
  title: string
  quantity: string
  lineItemNumber: string
}

interface CreateJobFormProps {
  accounts: Account[]
  dataSource: "supabase" | "mock"
}

export function CreateJobForm({ accounts, dataSource }: CreateJobFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [template, setTemplate] = useState<JobTemplateType>("crossarm")
  const [extraLineItems, setExtraLineItems] = useState<ExtraLineItem[]>([])
  const [orgUsers, setOrgUsers] = useState<ProfileSummary[]>([])
  const [assigneeIds, setAssigneeIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (dataSource !== "supabase") return
    void listOrgUsersForPickerAction().then((result) => {
      if (result.data) setOrgUsers(result.data)
    })
  }, [dataSource])

  function addExtraLineItem() {
    setExtraLineItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), title: "", quantity: "1", lineItemNumber: "" },
    ])
  }

  function removeExtraLineItem(key: string) {
    setExtraLineItems((prev) => prev.filter((li) => li.key !== key))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    const jobNumber = String(fd.get("jobNumber") ?? "").trim()
    const poNumber = String(fd.get("poNumber") ?? "").trim()
    const description = String(fd.get("description") ?? "").trim()
    const accountId = String(fd.get("accountId") ?? "")

    if (!jobNumber || !poNumber || !description) {
      toast.error("Missing required fields", "Job number, PO, and description are required.")
      return
    }

    if (dataSource === "mock") {
      toast.error("Supabase not configured", "Connect Supabase to create jobs with templates.")
      return
    }

    setIsSubmitting(true)
    const result = await createJobFromTemplateAction({
      jobNumber,
      poNumber,
      description,
      accountId: accountId ? resolveAccountId(accountId) : null,
      template,
      priority: (fd.get("priority") as "Normal" | "Hot" | "Urgent") || "Normal",
      deliveryDate: String(fd.get("deliveryDate") ?? "") || undefined,
      startDate: String(fd.get("startDate") ?? "") || undefined,
      tonnage: fd.get("tonnage") ? Number(fd.get("tonnage")) : undefined,
      value: fd.get("value") ? Number(fd.get("value")) : undefined,
      notes: String(fd.get("notes") ?? "") || undefined,
      assigneeProfileIds: [...assigneeIds],
      additionalLineItems: extraLineItems
        .filter((li) => li.title.trim())
        .map((li) => ({
          title: li.title.trim(),
          quantity: Number(li.quantity) || 1,
          lineItemNumber: li.lineItemNumber.trim() || undefined,
        })),
    })
    setIsSubmitting(false)

    if (result.error) {
      toast.error("Could not create job", result.error)
      return
    }

    if (result.data) {
      toast.success("Job created", "Line items and checklist tasks have been seeded.")
      router.push(`/jobs/${result.data.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Job details</CardTitle>
          <CardDescription>PO, customer, and schedule information</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="description" className="text-xs font-medium text-muted-foreground">
              Description *
            </label>
            <Input id="description" name="description" required placeholder="230kV Substation Crossarm Assembly" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="jobNumber" className="text-xs font-medium text-muted-foreground">
              Job number *
            </label>
            <Input id="jobNumber" name="jobNumber" required placeholder="QB-2025-042" className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="poNumber" className="text-xs font-medium text-muted-foreground">
              PO number *
            </label>
            <Input id="poNumber" name="poNumber" required placeholder="BPA PO 90866" className="font-mono" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="accountId" className="text-xs font-medium text-muted-foreground">
              Customer
            </label>
            <select
              id="accountId"
              name="accountId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              defaultValue=""
            >
              <option value="">Select customer…</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.shortName})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="priority" className="text-xs font-medium text-muted-foreground">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              defaultValue="Normal"
            >
              <option value="Normal">Normal</option>
              <option value="Hot">Hot</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="value" className="text-xs font-medium text-muted-foreground">
              Contract value ($)
            </label>
            <Input id="value" name="value" type="number" min={0} step={1000} placeholder="312500" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="startDate" className="text-xs font-medium text-muted-foreground">
              Start date
            </label>
            <Input id="startDate" name="startDate" type="date" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="deliveryDate" className="text-xs font-medium text-muted-foreground">
              Delivery date
            </label>
            <Input id="deliveryDate" name="deliveryDate" type="date" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="tonnage" className="text-xs font-medium text-muted-foreground">
              Tonnage
            </label>
            <Input id="tonnage" name="tonnage" type="number" min={0} step={0.1} placeholder="18.4" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="notes" className="text-xs font-medium text-muted-foreground">
              Notes
            </label>
            <Input id="notes" name="notes" placeholder="Site access, galvanizer lead time, etc." />
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Production template</CardTitle>
          <CardDescription>
            Chooses the Trello-style checklist seeded onto each line item (placeholder + any extras below)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {JOB_TEMPLATE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTemplate(opt.value)}
                className={cn(
                  "text-left rounded-lg border p-4 transition-colors",
                  template === opt.value
                    ? "border-[var(--orange)] bg-[var(--orange-muted)]/30 ring-1 ring-[var(--orange)]"
                    : "hover:border-muted-foreground/40"
                )}
              >
                <p className="text-sm font-semibold">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {dataSource === "supabase" && orgUsers.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Assign team</CardTitle>
            <CardDescription>Optional — members only see jobs they are assigned to</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-48 overflow-y-auto">
            {orgUsers.map((user) => (
              <label
                key={user.id}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/40 rounded px-2 py-1"
              >
                <input
                  type="checkbox"
                  checked={assigneeIds.has(user.id)}
                  onChange={() => {
                    setAssigneeIds((prev) => {
                      const next = new Set(prev)
                      if (next.has(user.id)) next.delete(user.id)
                      else next.add(user.id)
                      return next
                    })
                  }}
                  className="rounded border-input"
                />
                <span>{user.fullName}</span>
                <span className="text-xs text-muted-foreground ml-auto capitalize">{user.role}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Additional line items</CardTitle>
            <CardDescription>
              Optional — each gets the full template checklist. A placeholder line item is always created.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={addExtraLineItem}>
            <Plus className="size-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {extraLineItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No extra line items. The template placeholder card will be created automatically.
            </p>
          ) : (
            extraLineItems.map((li) => (
              <div key={li.key} className="flex flex-wrap gap-2 items-end border rounded-lg p-3">
                <div className="flex-1 min-w-[180px] space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase">Title</label>
                  <Input
                    value={li.title}
                    onChange={(e) =>
                      setExtraLineItems((prev) =>
                        prev.map((x) => (x.key === li.key ? { ...x, title: e.target.value } : x))
                      )
                    }
                    placeholder="2 ea MK-115DC Crossarm"
                  />
                </div>
                <div className="w-20 space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase">Qty</label>
                  <Input
                    type="number"
                    min={1}
                    value={li.quantity}
                    onChange={(e) =>
                      setExtraLineItems((prev) =>
                        prev.map((x) => (x.key === li.key ? { ...x, quantity: e.target.value } : x))
                      )
                    }
                  />
                </div>
                <div className="w-28 space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase">CID #</label>
                  <Input
                    value={li.lineItemNumber}
                    onChange={(e) =>
                      setExtraLineItems((prev) =>
                        prev.map((x) =>
                          x.key === li.key ? { ...x, lineItemNumber: e.target.value } : x
                        )
                      )
                    }
                    placeholder="MK-115DC"
                    className="font-mono text-xs"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeExtraLineItem(li.key)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" data-icon="inline-start" />}
          Create job from template
        </Button>
        {dataSource === "mock" && (
          <Badge variant="secondary" className="text-xs">
            Supabase required to save
          </Badge>
        )}
      </div>
    </form>
  )
}
