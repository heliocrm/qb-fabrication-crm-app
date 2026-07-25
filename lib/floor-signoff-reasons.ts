export const FLOOR_SIGNOFF_REASON_CODES = [
  "completed_as_drawn",
  "fitup_ok",
  "weld_complete",
  "partial_qty",
  "needs_rework",
  "material_issue",
  "covering_for_other",
] as const

export type FloorSignoffReasonCode = (typeof FLOOR_SIGNOFF_REASON_CODES)[number]

export const FLOOR_SIGNOFF_REASON_LABELS: Record<FloorSignoffReasonCode, string> = {
  completed_as_drawn: "Completed as drawn",
  fitup_ok: "Fit-up OK",
  weld_complete: "Weld complete",
  partial_qty: "Partial qty",
  needs_rework: "Needs rework / hold",
  material_issue: "Material issue",
  covering_for_other: "Covering for someone else",
}

export const FLOOR_TASK_CATEGORIES = [
  "Machine",
  "Fabrication",
  "Quality Assurance",
  "Shipping",
] as const

export type FloorTaskCategory = (typeof FLOOR_TASK_CATEGORIES)[number]

export function isFloorTaskCategory(category: string): category is FloorTaskCategory {
  return (FLOOR_TASK_CATEGORIES as readonly string[]).includes(category)
}

export function isFloorSignoffReasonCode(
  value: string
): value is FloorSignoffReasonCode {
  return (FLOOR_SIGNOFF_REASON_CODES as readonly string[]).includes(value)
}

export const FLOOR_NOTE_MAX_CHARS = 280
