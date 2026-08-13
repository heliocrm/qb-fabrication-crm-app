import type { Job } from "@/types"
import type { PullReasonDatum } from "@/lib/reports/metrics"

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function jobsToCsv(
  jobs: Job[],
  options?: { includeValue?: boolean }
): string {
  const includeValue = options?.includeValue !== false
  const header = [
    "Job Number",
    "PO Number",
    "Customer",
    "Description",
    "Status",
    "Priority",
    ...(includeValue ? ["Value"] : []),
    "Tonnage",
    "Start Date",
    "Delivery Date",
    "Progress",
  ]
  const rows = jobs.map((j) =>
    [
      j.jobNumber,
      j.poNumber,
      j.customer,
      j.description,
      j.status,
      j.priority,
      ...(includeValue ? [j.value] : []),
      j.tonnage,
      j.startDate,
      j.deliveryDate,
      j.progress,
    ]
      .map(csvEscape)
      .join(",")
  )
  return [header.join(","), ...rows].join("\n")
}

export function pullReasonsToCsv(rows: PullReasonDatum[]): string {
  const header = ["Reason Code", "Label", "Count"]
  const body = rows.map((r) =>
    [r.reasonCode, r.label, r.count].map(csvEscape).join(",")
  )
  return [header.join(","), ...body].join("\n")
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
