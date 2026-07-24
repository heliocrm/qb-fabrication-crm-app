import type { DocumentType, Task, TaskCategory } from "@/types"

export const TASK_CATEGORIES: TaskCategory[] = [
  "Programming",
  "Machine",
  "Fabrication",
  "Quality Assurance",
  "Shipping",
  "Office",
]

export const DOCUMENT_CATEGORIES: DocumentType[] = [
  "Drawing",
  "PO",
  "Work Order",
  "Traveler",
  "Inspection",
  "Shipping",
]

export const LINE_ITEM_WIP_STATUSES = ["To Do", "Doing", "Done"] as const

export const taskCategoryStyles: Record<TaskCategory, string> = {
  Programming:
    "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-900",
  Machine:
    "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-800",
  Fabrication:
    "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900",
  "Quality Assurance":
    "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900",
  Shipping:
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
  Office:
    "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-900",
}

export const wipStatusStyles: Record<(typeof LINE_ITEM_WIP_STATUSES)[number], string> = {
  "To Do": "bg-slate-100 text-slate-700 border-slate-200",
  Doing: "bg-blue-100 text-blue-800 border-blue-200",
  Done: "bg-green-100 text-green-800 border-green-200",
}

export const docTypeMeta: Record<
  DocumentType,
  { icon: string; color: string }
> = {
  Drawing: { icon: "📐", color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30" },
  "Work Order": { icon: "📋", color: "bg-slate-50 border-slate-200 dark:bg-slate-900/30" },
  Traveler: { icon: "🧾", color: "bg-orange-50 border-orange-200 dark:bg-orange-950/30" },
  Inspection: { icon: "🔍", color: "bg-purple-50 border-purple-200 dark:bg-purple-950/30" },
  Shipping: { icon: "🚛", color: "bg-amber-50 border-amber-200 dark:bg-amber-950/30" },
  PO: { icon: "📄", color: "bg-green-50 border-green-200 dark:bg-green-950/30" },
}

export function formatJobCurrency(n: number): string {
  return n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : `$${n.toLocaleString()}`
}

export function formatJobDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function getDriveFolderUrl(jobNumber: string): string {
  return `https://drive.google.com/drive/folders/mock-${jobNumber.replace(/-/g, "")}`
}

/** Flatten all tasks from line items for aggregate stats */
export function flattenLineItemTasks(lineItems: { tasks: Task[] }[]): Task[] {
  return lineItems.flatMap((li) => li.tasks)
}
