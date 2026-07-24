import type { MaterialPullStatus } from "@/types"

export const MATERIAL_PULL_FUNNEL =
  "Submission → Approval → Batch & Pull" as const

export const MATERIAL_PULL_STATUSES: MaterialPullStatus[] = [
  "pending",
  "approved",
  "batched",
  "pulled",
  "cancelled",
]

export const MATERIAL_PULL_STATUS_LABELS: Record<MaterialPullStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  batched: "Batched",
  pulled: "Pulled",
  cancelled: "Cancelled",
}

/** Drop locations — shop equipment / areas (from floor walkthrough). */
export const MATERIAL_PULL_LOCATIONS = [
  "Inside Angle Master",
  "Outside Angle Master",
  "Shear",
  "Brake",
  "Inside Beam Line",
  "Outside Beam Line",
  "Plate Burner",
  "Blacktop",
] as const

/** @deprecated Use MATERIAL_PULL_LOCATIONS */
export const MATERIAL_PULL_STAGES = MATERIAL_PULL_LOCATIONS

export const MATERIAL_PULL_CANNED_NOTES = [
  "Staged at drop location",
  "Partial — remainder on order",
  "Substituted section — see note",
  "Could not locate — returned to Approver",
] as const

export type MaterialPullChecklistItem = {
  id: string
  label: string
  done: boolean
}

export type MaterialPullChecklist = {
  items: MaterialPullChecklistItem[]
  completedAt?: string | null
  notePreset?: string | null
}

export const MATERIAL_PULL_DEFAULT_CHECKLIST: Omit<
  MaterialPullChecklistItem,
  "done"
>[] = [
  { id: "located", label: "Located material" },
  { id: "qty", label: "Qty verified" },
  { id: "staged", label: "Staged at location" },
  { id: "ready", label: "Ready for fab" },
]

export function createDefaultPullChecklist(): MaterialPullChecklist {
  return {
    items: MATERIAL_PULL_DEFAULT_CHECKLIST.map((item) => ({
      ...item,
      done: false,
    })),
    completedAt: null,
    notePreset: null,
  }
}

export function statusBadgeClass(status: MaterialPullStatus): string {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
    case "approved":
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
