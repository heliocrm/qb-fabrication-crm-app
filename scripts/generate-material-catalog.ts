/**
 * Build data/material-catalog.json from the Procurement Status Log CSV.
 *
 * Usage: pnpm catalog:materials
 */

import { createHash } from "crypto"
import { readFileSync, writeFileSync, mkdirSync } from "fs"
import path from "path"

const ROOT = process.cwd()
const SOURCE_REL =
  "data/docs/PROCUREMENT STATUS LOG.xlsx - MATERIAL LIST FOR PROJECTS.csv"
const OUT_REL = "data/material-catalog.json"

export type MaterialCatalogItem = {
  id: string
  label: string
  searchText: string
}

export type MaterialCatalogFile = {
  generatedAt: string
  source: string
  items: MaterialCatalogItem[]
}

/** Minimal CSV parser that handles quoted fields with commas */
function parseCsv(content: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const ch = content[i]
    const next = content[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
      continue
    }

    if (ch === ",") {
      row.push(field)
      field = ""
      continue
    }

    if (ch === "\n" || (ch === "\r" && next === "\n")) {
      row.push(field)
      field = ""
      if (row.some((c) => c.trim() !== "")) rows.push(row)
      row = []
      if (ch === "\r") i++
      continue
    }

    if (ch === "\r") {
      row.push(field)
      field = ""
      if (row.some((c) => c.trim() !== "")) rows.push(row)
      row = []
      continue
    }

    field += ch
  }

  row.push(field)
  if (row.some((c) => c.trim() !== "")) rows.push(row)

  return rows
}

/** Collapse whitespace; normalize ×/#/x variants for matching keys */
export function toSearchText(label: string): string {
  return label
    .toLowerCase()
    .replace(/[×✕✖]/g, "x")
    .replace(/#/g, "")
    .replace(/[''′]/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[^a-z0-9./'"-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function toDedupeKey(label: string): string {
  return toSearchText(label).replace(/\s+/g, "").toUpperCase()
}

function stableId(label: string): string {
  const hash = createHash("sha1").update(toDedupeKey(label)).digest("hex").slice(0, 10)
  return `mat_${hash}`
}

function main() {
  const sourcePath = path.join(ROOT, SOURCE_REL)
  const outPath = path.join(ROOT, OUT_REL)
  const raw = readFileSync(sourcePath, "utf8")
  const rows = parseCsv(raw)
  if (rows.length < 2) {
    throw new Error(`No data rows in ${SOURCE_REL}`)
  }

  const header = rows[0].map((h) => h.trim())
  const colIdx = header.findIndex(
    (h) => h.toLowerCase() === "material description"
  )
  if (colIdx < 0) {
    throw new Error(
      `Column "Material Description" not found. Headers: ${header.join(", ")}`
    )
  }

  /** dedupeKey -> { label, count } */
  const counts = new Map<string, Map<string, number>>()

  for (let r = 1; r < rows.length; r++) {
    const label = (rows[r][colIdx] ?? "").trim()
    if (!label) continue
    const key = toDedupeKey(label)
    if (!key) continue
    const variants = counts.get(key) ?? new Map<string, number>()
    variants.set(label, (variants.get(label) ?? 0) + 1)
    counts.set(key, variants)
  }

  const items: MaterialCatalogItem[] = [...counts.entries()]
    .map(([, variants]) => {
      let bestLabel = ""
      let bestCount = -1
      for (const [label, count] of variants) {
        if (
          count > bestCount ||
          (count === bestCount && label.length > bestLabel.length)
        ) {
          bestLabel = label
          bestCount = count
        }
      }
      return {
        id: stableId(bestLabel),
        label: bestLabel,
        searchText: toSearchText(bestLabel),
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base" }))

  const catalog: MaterialCatalogFile = {
    generatedAt: new Date().toISOString(),
    source: SOURCE_REL.replace(/\\/g, "/"),
    items,
  }

  mkdirSync(path.dirname(outPath), { recursive: true })
  writeFileSync(outPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8")
  console.log(`Wrote ${items.length} materials → ${OUT_REL}`)
}

main()
