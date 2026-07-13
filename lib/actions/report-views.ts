"use server"

import {
  createReportView,
  deleteReportView,
  updateReportView,
} from "@/lib/supabase/services/report-views"
import { serializeReportsFilters } from "@/lib/reports/filters"
import type { ReportsFilters } from "@/lib/reports/filters"
import type { ReportView } from "@/types"

type ActionResult<T> = { data?: T; error?: string }

export async function saveReportViewAction(
  name: string,
  filters: ReportsFilters
): Promise<ActionResult<ReportView>> {
  try {
    const data = await createReportView(name, serializeReportsFilters(filters))
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save view" }
  }
}

export async function updateReportViewAction(
  id: string,
  patch: { name?: string; filters?: ReportsFilters }
): Promise<ActionResult<ReportView>> {
  try {
    const data = await updateReportView(id, {
      name: patch.name,
      filters: patch.filters ? serializeReportsFilters(patch.filters) : undefined,
    })
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update view" }
  }
}

export async function deleteReportViewAction(id: string): Promise<ActionResult<void>> {
  try {
    await deleteReportView(id)
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete view" }
  }
}
