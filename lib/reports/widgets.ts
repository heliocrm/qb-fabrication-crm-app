import type { ReportsComputedData } from "@/lib/reports/metrics"

export type ReportsWidgetSpan = "full" | "half" | "third"

export interface ReportsWidgetDef {
  id: string
  title: string
  defaultSpan: ReportsWidgetSpan
}

export interface ReportsWidgetProps {
  data: ReportsComputedData
}

/** Registry of report widgets — add new entries here to extend the BI layer */
export const REPORTS_WIDGETS: ReportsWidgetDef[] = [
  { id: "core-metrics", title: "Core Metrics", defaultSpan: "full" },
  { id: "jobs-by-status", title: "Jobs by Status", defaultSpan: "half" },
  { id: "revenue-by-customer", title: "Revenue by Customer", defaultSpan: "half" },
  { id: "pipeline", title: "Pipeline", defaultSpan: "half" },
  { id: "delivery-schedule", title: "Delivery Schedule", defaultSpan: "third" },
  { id: "summary", title: "Summary", defaultSpan: "third" },
]

export function spanClassName(span: ReportsWidgetSpan): string {
  switch (span) {
    case "full":
      return "col-span-1 xl:col-span-2"
    case "half":
      return "col-span-1"
    case "third":
      return "col-span-1"
    default:
      return "col-span-1"
  }
}
