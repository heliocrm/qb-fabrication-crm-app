import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { Tables, requireOrganizationId, throwOnError } from "@/lib/supabase/schema"
import { requireSessionContext } from "@/lib/auth/session"
import type { ReportView, ReportViewRow } from "@/types"
import type { Json } from "@/types"

function mapReportView(row: ReportViewRow): ReportView {
  return {
    id: row.id,
    name: row.name,
    filters: row.filters as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Saved report views — always scoped to the signed-in user's profile.
 * DB RLS (`report_views_*` policies) also enforces profile_id = auth.uid()'s profile;
 * app-layer filters reinforce that so views are never shared across users.
 */
export async function listReportViews(): Promise<ReportView[]> {
  if (!isSupabaseConfigured()) return []

  try {
    const ctx = await requireSessionContext()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from(Tables.report_views)
      .select("*")
      .eq("profile_id", ctx.profileId)
      .order("updated_at", { ascending: false })

    throwOnError({ data, error })
    return ((data ?? []) as ReportViewRow[]).map(mapReportView)
  } catch {
    return []
  }
}

export async function createReportView(
  name: string,
  filters: Record<string, unknown>
): Promise<ReportView> {
  const ctx = await requireSessionContext()
  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.report_views)
    .insert({
      profile_id: ctx.profileId,
      organization_id: ctx.organizationId,
      name: name.trim(),
      filters: filters as Json,
    })
    .select("*")
    .single()

  throwOnError({ data, error })
  return mapReportView(data as ReportViewRow)
}

export async function updateReportView(
  id: string,
  patch: { name?: string; filters?: Record<string, unknown> }
): Promise<ReportView> {
  const ctx = await requireSessionContext()
  const supabase = await createClient()

  const payload: {
    updated_at: string
    name?: string
    filters?: Json
  } = { updated_at: new Date().toISOString() }
  if (patch.name !== undefined) payload.name = patch.name.trim()
  if (patch.filters !== undefined) payload.filters = patch.filters as Json

  const { data, error } = await supabase
    .from(Tables.report_views)
    .update(payload)
    .eq("id", id)
    .eq("profile_id", ctx.profileId)
    .select("*")
    .single()

  throwOnError({ data, error })
  return mapReportView(data as ReportViewRow)
}

export async function deleteReportView(id: string): Promise<void> {
  const ctx = await requireSessionContext()
  const supabase = await createClient()

  const { error } = await supabase
    .from(Tables.report_views)
    .delete()
    .eq("id", id)
    .eq("profile_id", ctx.profileId)

  if (error) throwOnError({ data: null, error })
}
