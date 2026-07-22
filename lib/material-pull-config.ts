import type { MaterialPullStatus } from "@/types"

export const MATERIAL_PULL_STATUSES: MaterialPullStatus[] = [
  "pending",
  "sourced",
  "batched",
  "pulled",
  "cancelled",
]

export const MATERIAL_PULL_STATUS_LABELS: Record<MaterialPullStatus, string> = {
  pending: "Pending",
  sourced: "Sourced",
  batched: "Batched",
  pulled: "Pulled",
  cancelled: "Cancelled",
}

export const MATERIAL_PULL_STAGES = [
  "Fabrication",
  "Machine",
  "Programming",
  "Quality Assurance",
  "Shipping",
  "Office",
] as const

export function statusBadgeClass(status: MaterialPullStatus): string {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
    case "sourced":
      return "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200"
    case "batched":
      return "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200"
    case "pulled":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
    case "cancelled":
      return "bg-muted text-muted-foreground"
    default:
      return ""
  }
}

export function formatNeededBy(value: string | null): string {
  if (!value) return "—"
  try {
    return new Date(value + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return value
  }
}
