import type { DocumentType, TaskCategory } from "@/types"

export const TASK_CATEGORIES: TaskCategory[] = [
  "Engineering",
  "Fabrication",
  "QC",
  "Logistics",
]

export const DOCUMENT_CATEGORIES: DocumentType[] = [
  "Drawing",
  "PO",
  "Work Order",
  "Inspection",
  "Shipping",
]

export const taskCategoryStyles: Record<TaskCategory, string> = {
  Fabrication: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900",
  QC: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900",
  Logistics: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
  Engineering: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-900",
}

export const docTypeMeta: Record<
  DocumentType,
  { icon: string; color: string }
> = {
  Drawing: { icon: "📐", color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30" },
  "Work Order": { icon: "📋", color: "bg-slate-50 border-slate-200 dark:bg-slate-900/30" },
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
