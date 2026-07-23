import catalog from "@/data/material-catalog.json"

export type MaterialCatalogItem = {
  id: string
  label: string
  searchText: string
}

export type MaterialCatalog = {
  generatedAt: string
  source: string
  items: MaterialCatalogItem[]
}

export const MATERIAL_CATALOG = catalog as MaterialCatalog

/** Normalize query the same way catalog searchText is built */
export function normalizeMaterialQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[×✕✖]/g, "x")
    .replace(/#/g, "")
    .replace(/[''′]/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[^a-z0-9./'"-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Filter catalog by query. Empty query returns the first `limit` items (browse).
 * Matches against label + searchText; compact form (no spaces) helps L4x4 vs L4 X 4.
 */
export function filterMaterialCatalog(
  query: string,
  limit = 12
): MaterialCatalogItem[] {
  const items = MATERIAL_CATALOG.items
  const q = normalizeMaterialQuery(query)
  if (!q) {
    return items.slice(0, limit)
  }

  const compact = q.replace(/\s+/g, "")
  const scored: { item: MaterialCatalogItem; score: number }[] = []

  for (const item of items) {
    const labelLower = item.label.toLowerCase()
    const search = item.searchText
    const searchCompact = search.replace(/\s+/g, "")

    let score = -1
    if (labelLower === q || search === q) score = 100
    else if (labelLower.startsWith(q) || search.startsWith(q)) score = 80
    else if (searchCompact.startsWith(compact)) score = 70
    else if (search.includes(q) || labelLower.includes(q)) score = 50
    else if (searchCompact.includes(compact)) score = 40

    if (score >= 0) scored.push({ item, score })
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.item.label.localeCompare(b.item.label, "en", { sensitivity: "base" })
  })

  return scored.slice(0, limit).map((s) => s.item)
}

export function isExactCatalogMatch(value: string): boolean {
  const q = normalizeMaterialQuery(value)
  if (!q) return false
  const compact = q.replace(/\s+/g, "")
  return MATERIAL_CATALOG.items.some((item) => {
    const search = item.searchText
    return (
      search === q ||
      item.label.toLowerCase() === q ||
      search.replace(/\s+/g, "") === compact
    )
  })
}
