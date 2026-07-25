import type {
  MaterialPullPriority,
  MaterialPullReasonCode,
  MaterialPullStatus,
} from "@/types"

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

export const MATERIAL_PULL_PRIORITIES: MaterialPullPriority[] = [
  "hot",
  "soon",
  "low",
]

export const MATERIAL_PULL_PRIORITY_LABELS: Record<MaterialPullPriority, string> =
  {
    hot: "Hot",
    soon: "Soon",
    low: "Low",
  }

/** Sort rank: lower = higher urgency */
export const MATERIAL_PULL_PRIORITY_RANK: Record<MaterialPullPriority, number> =
  {
    hot: 0,
    soon: 1,
    low: 2,
  }

/** All DB-valid reason codes (includes legacy `borrow`). */
export const MATERIAL_PULL_REASON_CODES: MaterialPullReasonCode[] = [
  "scrap",
  "nest_wrong",
  "short_staged",
  "customer_rush",
  "borrow",
  "other",
]

/** Reasons shown in create/edit pickers — borrow is a separate checkbox flag. */
export const MATERIAL_PULL_REASON_CODES_SELECTABLE: MaterialPullReasonCode[] = [
  "scrap",
  "nest_wrong",
  "short_staged",
  "customer_rush",
  "other",
]

export const MATERIAL_PULL_REASON_LABELS: Record<
  MaterialPullReasonCode,
  string
> = {
  scrap: "Scrap / bad part",
  nest_wrong: "Nest / BOM wrong",
  short_staged: "Short staged",
  customer_rush: "Customer rush",
  borrow: "Borrow from another job (legacy)",
  other: "Other",
}

/** @deprecated Prefer `isBorrowRequest` — borrow is a flag via source job #. */
export function isBorrowReason(code: MaterialPullReasonCode | null | undefined): boolean {
  return code === "borrow"
}

/** True when material is taken from another job (source set) or legacy reason_code. */
export function isBorrowRequest(input: {
  reasonCode?: MaterialPullReasonCode | null
  sourceJobNumber?: string | null
}): boolean {
  if (input.sourceJobNumber?.trim()) return true
  return input.reasonCode === "borrow"
}

/** Drop locations - shop equipment / areas (from floor walkthrough). */
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
  "Partial - remainder on order",
  "Substituted section - see note",
  "Could not locate - returned to Approver",
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

export function priorityBadgeClass(priority: MaterialPullPriority): string {
  switch (priority) {
    case "hot":
      return "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200"
    case "soon":
      return "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200"
    case "low":
      return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200"
    default:
      return ""
  }
}

export function formatNeededBy(value: string | null): string {
  if (!value) return "-"
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

export function compareMaterialPullQueueOrder<
  T extends {
    priority: MaterialPullPriority
    neededBy: string | null
    createdAt: string
  },
>(a: T, b: T): number {
  const pr =
    MATERIAL_PULL_PRIORITY_RANK[a.priority] -
    MATERIAL_PULL_PRIORITY_RANK[b.priority]
  if (pr !== 0) return pr
  if (a.neededBy && b.neededBy && a.neededBy !== b.neededBy) {
    return a.neededBy < b.neededBy ? -1 : 1
  }
  if (a.neededBy && !b.neededBy) return -1
  if (!a.neededBy && b.neededBy) return 1
  return a.createdAt < b.createdAt ? 1 : -1
}
