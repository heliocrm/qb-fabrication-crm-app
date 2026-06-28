import { createClient } from "@/lib/supabase/server"
import {
  JOB_LIST_SELECT,
  Tables,
  requireOrganizationId,
  throwOnError,
} from "@/lib/supabase/schema"
import { mapJobListItem } from "@/lib/supabase/mappers"
import type { GlobalSearchResult } from "@/lib/search-types"
import { SEARCH_RESULT_LIMIT } from "@/lib/search-types"
import type { JobListItem, JobRow } from "@/types"

type JobListRow = JobRow & {
  accounts: { id: string; name: string; short_name: string } | null
}

/**
 * Search jobs, opportunities, and customers scoped to the current organization (RLS).
 */
export async function globalSearch(
  query: string,
  limit = SEARCH_RESULT_LIMIT
): Promise<GlobalSearchResult[]> {
  const term = query.trim()
  if (!term) return []

  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const pattern = `%${term}%`

  const [jobsResult, oppsResult, accountsResult] = await Promise.all([
    supabase
      .from(Tables.jobs)
      .select(JOB_LIST_SELECT)
      .or(
        `job_number.ilike.${pattern},po_number.ilike.${pattern},description.ilike.${pattern}`
      )
      .order("updated_at", { ascending: false })
      .limit(limit),

    supabase
      .from(Tables.opportunities)
      .select("id, title, stage, assignee, accounts:account_id ( name, short_name )")
      .or(`title.ilike.${pattern},assignee.ilike.${pattern}`)
      .order("close_date", { ascending: true, nullsFirst: false })
      .limit(limit),

    supabase
      .from(Tables.accounts)
      .select("id, name, short_name, city, state, contact, email")
      .or(
        `name.ilike.${pattern},short_name.ilike.${pattern},contact.ilike.${pattern},email.ilike.${pattern}`
      )
      .order("name", { ascending: true })
      .limit(limit),
  ])

  throwOnError(jobsResult)
  throwOnError(oppsResult)
  throwOnError(accountsResult)

  const results: GlobalSearchResult[] = []

  for (const row of (jobsResult.data ?? []) as unknown as JobListRow[]) {
    const job: JobListItem = mapJobListItem(row)
    results.push({
      id: job.id,
      type: "job",
      title: job.jobNumber,
      subtitle: `${job.poNumber} · ${job.customer}`,
      href: `/jobs/${job.id}`,
      badge: job.status,
    })
  }

  for (const row of oppsResult.data ?? []) {
    const account = row.accounts as { name: string; short_name: string } | null
    const customer = account?.name ?? "Unknown"
    results.push({
      id: row.id,
      type: "opportunity",
      title: row.title,
      subtitle: `${customer} · ${row.stage}`,
      href: "/opportunities",
      badge: row.stage,
    })
  }

  for (const row of accountsResult.data ?? []) {
    const location = [row.city, row.state].filter(Boolean).join(", ")
    results.push({
      id: row.id,
      type: "account",
      title: row.name,
      subtitle: location
        ? `${row.short_name} · ${location}`
        : row.short_name,
      href: "/customers",
    })
  }

  return results
}
