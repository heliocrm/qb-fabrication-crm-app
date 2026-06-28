import { jobs, opportunities, accounts } from "@/lib/mock-data"
import type { GlobalSearchResult } from "@/lib/search-types"
import { SEARCH_RESULT_LIMIT } from "@/lib/search-types"

/** Client-side mock search — used when Supabase is not configured */
export function searchMockData(query: string, limit = SEARCH_RESULT_LIMIT): GlobalSearchResult[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const results: GlobalSearchResult[] = []

  for (const job of jobs) {
    const haystack = [
      job.jobNumber,
      job.poNumber,
      job.customer,
      job.description,
      ...job.markNumbers,
    ]
      .join(" ")
      .toLowerCase()

    if (haystack.includes(q)) {
      results.push({
        id: job.id,
        type: "job",
        title: job.jobNumber,
        subtitle: `${job.poNumber} · ${job.customer}`,
        href: `/jobs/${job.id}`,
        badge: job.status,
      })
    }
  }

  for (const opp of opportunities) {
    const haystack = [opp.title, opp.customer, opp.assignee, opp.stage]
      .join(" ")
      .toLowerCase()

    if (haystack.includes(q)) {
      results.push({
        id: opp.id,
        type: "opportunity",
        title: opp.title,
        subtitle: `${opp.customer} · ${opp.stage}`,
        href: "/opportunities",
        badge: opp.stage,
      })
    }
  }

  for (const account of accounts) {
    const haystack = [account.name, account.shortName, account.contact, account.email]
      .join(" ")
      .toLowerCase()

    if (haystack.includes(q)) {
      results.push({
        id: account.id,
        type: "account",
        title: account.name,
        subtitle: `${account.shortName} · ${account.city}, ${account.state}`,
        href: "/customers",
      })
    }
  }

  return results.slice(0, limit * 3)
}
