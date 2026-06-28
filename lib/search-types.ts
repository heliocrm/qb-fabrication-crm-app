export type GlobalSearchResultType = "job" | "opportunity" | "account"

export interface GlobalSearchResult {
  id: string
  type: GlobalSearchResultType
  title: string
  subtitle: string
  href: string
  badge?: string
}

export const SEARCH_RESULT_LIMIT = 4
