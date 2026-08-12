import { resolveCustomerName } from "@/lib/travelers/customer-map"
import { extractPdfWordsAndText, type PdfWord } from "@/lib/travelers/pdf-words"
import type { ParsedWorkOrder, TravelerCatalogItem } from "@/lib/travelers/types"

/** Alphanumeric catalog IDs (PGE/QB-style): TRNR-0501, SNST-0532, MK-0550H */
const ALPHA_CATALOG_ID = /^[A-Z]{2,6}[-\s]?\d{3,6}[A-Z]{0,2}$/

/** Mark / structure in description: (MK-0532R), (MK-0552H) */
const MARK_IN_PARENS = /\((MK-[A-Z0-9]+)\)/i

const PREAMBLE_PREFIXES = [
  "QB***",
  "QB BPA",
  "BPA CID",
  "SPEC #",
  "SPEC#",
  "DWG",
]

const ROW_TOLERANCE = 3.0

const CATALOG_ID_TOKEN =
  "([A-Z]{2,6}[-\\s]?\\d{3,6}[A-Z]{0,2}|\\d{5,}|N\\/A)"

type ColumnCenters = {
  line_item: number
  catalog: number
  description: number
  quantity: number
}

function isValidCatalogId(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  if (v.toUpperCase() === "N/A") return true
  if (ALPHA_CATALOG_ID.test(v.toUpperCase())) return true
  if (/^\d+$/.test(v) && v.length >= 5) return true
  return false
}

function isCodeLine(line: string): boolean {
  const stripped = line.trim()
  if (!stripped) return false
  if (/^\d+$/.test(stripped)) return true
  if (stripped.toUpperCase() === "N/A") return true
  return ALPHA_CATALOG_ID.test(stripped.toUpperCase())
}

function isPreambleLine(line: string): boolean {
  const stripped = line.trim().toUpperCase()
  return PREAMBLE_PREFIXES.some((p) => stripped.startsWith(p.toUpperCase()))
}

function isDescriptionLine(line: string): boolean {
  const stripped = line.trim()
  if (!stripped) return false
  if (isCodeLine(stripped)) return false
  if (isPreambleLine(stripped)) return false
  const lowered = stripped.toLowerCase()
  if (lowered.startsWith("page ")) return false
  if (
    stripped === "Description" ||
    stripped === "Line Item" ||
    stripped === "Quantity" ||
    stripped === "Catalog ID"
  ) {
    return false
  }
  if (stripped.startsWith("***")) return false
  return true
}

export function extractStructureNumber(description: string): string {
  const match = description.match(MARK_IN_PARENS)
  return match?.[1]?.toUpperCase() ?? ""
}

function fieldAfter(label: string, lines: string[]): string | null {
  for (const line of lines) {
    if (line.includes(label)) {
      let rest = line.split(label)[1]?.trim() || null
      if (!rest) return null
      // Stop at the next common WO label on the same visual line.
      rest = rest.split(
        /\s{2,}(?=(?:Customer PO|Order Date|Ship Date|Ship Via|Bill To|Ship To|QB Sales Order|Contact):)/i
      )[0]
      rest = rest?.split(/\s+(?=(?:Customer PO|Order Date|Ship Date|Ship Via|Bill To|Ship To|QB Sales Order|Contact):)/i)[0]
      return rest?.trim() || null
    }
  }
  return null
}

function extractShipToCustomer(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (!line.includes("Ship To:")) continue
    const same = line.split("Ship To:")[1]?.trim()
    if (same) return same
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      const next = lines[j]!.trim()
      if (!next) continue
      if (next.includes(":")) break
      return next
    }
  }
  return null
}

function extractHeaderFromText(text: string): {
  customerPo: string
  orderDate: string
  customer: string
  qbSalesOrder?: string
  shipDate?: string
} {
  const lines = text.split(/\r?\n/)
  const customerPo =
    fieldAfter("Customer PO:", lines)?.replace(/\s+/g, " ").trim() || "N/A"
  const orderDate =
    fieldAfter("Order Date:", lines)?.split(/\s{2,}|\t/)[0]?.trim() || "N/A"
  const qbSalesOrder =
    fieldAfter("QB Sales Order:", lines)?.trim() || undefined
  const shipDateRaw = fieldAfter("Ship Date:", lines)
  const shipDate = shipDateRaw
    ? shipDateRaw.split(/Ship Via:|Contact:/i)[0]?.trim() || undefined
    : undefined

  const shipTo = extractShipToCustomer(lines)
  const billTo = fieldAfter("Bill To:", lines)
  let customer = "N/A"
  if (shipTo) {
    customer = resolveCustomerName(shipTo)
  } else if (billTo) {
    customer = resolveCustomerName(billTo)
  }

  return { customerPo, orderDate, customer, qbSalesOrder, shipDate }
}

function findTableHeader(
  words: PdfWord[]
): { headerY: number; centers: ColumnCenters } | null {
  for (const w of words) {
    if (w[4].toLowerCase() !== "description") continue
    const headerY = w[1]
    const sameRow = words.filter((x) => Math.abs(x[1] - headerY) <= ROW_TOLERANCE * 3)
    const texts = sameRow.map((x) => x[4])
    const hasQuantity = texts.some((t) => /^quantity$/i.test(t))
    const hasCatalog = texts.some((t) => /^catalog$/i.test(t))
    if (!hasQuantity || !hasCatalog) continue

    const spanCenter = (...headerWords: string[]) => {
      const matches = sameRow.filter((x) =>
        headerWords.some((hw) => x[4].toLowerCase() === hw.toLowerCase())
      )
      if (!matches.length) return null
      const left = Math.min(...matches.map((x) => x[0]))
      const right = Math.max(...matches.map((x) => x[2]))
      return (left + right) / 2
    }

    const centers = {
      line_item: spanCenter("Line", "Item"),
      catalog: spanCenter("Catalog", "ID"),
      description: spanCenter("Description"),
      quantity: spanCenter("Quantity"),
    }
    if (Object.values(centers).some((v) => v == null)) continue
    return {
      headerY,
      centers: centers as ColumnCenters,
    }
  }
  return null
}

function midpointBoundaries(centers: ColumnCenters): number[] {
  const ordered = Object.values(centers).sort((a, b) => a - b)
  const boundaries: number[] = []
  for (let i = 0; i < ordered.length - 1; i++) {
    boundaries.push((ordered[i]! + ordered[i + 1]!) / 2)
  }
  return boundaries
}

function clusterRows(words: PdfWord[]): PdfWord[][] {
  const rows: PdfWord[][] = []
  const sorted = [...words].sort((a, b) => a[1] - b[1] || a[0] - b[0])
  for (const w of sorted) {
    if (rows.length && Math.abs(w[1] - rows[rows.length - 1]![0]![1]) <= ROW_TOLERANCE) {
      rows[rows.length - 1]!.push(w)
    } else {
      rows.push([w])
    }
  }
  for (const row of rows) {
    row.sort((a, b) => a[0] - b[0])
  }
  return rows
}

function assignColumns(
  row: PdfWord[],
  orderedNames: (keyof ColumnCenters)[],
  boundaries: number[]
): Record<keyof ColumnCenters, string> {
  const columns: Record<keyof ColumnCenters, string[]> = {
    line_item: [],
    catalog: [],
    description: [],
    quantity: [],
  }

  for (const w of row) {
    const wordCenter = (w[0] + w[2]) / 2
    let zone = 0
    while (zone < boundaries.length && wordCenter > boundaries[zone]!) {
      zone++
    }
    const name = orderedNames[zone]
    if (name) columns[name].push(w[4])
  }

  return {
    line_item: columns.line_item.join(" ").trim(),
    catalog: columns.catalog.join(" ").trim(),
    description: columns.description.join(" ").trim(),
    quantity: columns.quantity.join(" ").trim(),
  }
}

type PositionalDraft = {
  catalogId: string
  descriptionParts: string[]
  lineNumber?: string
  quantity?: number
}

function extractPositionalItems(
  wordsByPage: PdfWord[][]
): TravelerCatalogItem[] {
  const catalogItems: PositionalDraft[] = []
  let currentItem: PositionalDraft | null = null

  for (const words of wordsByPage) {
    const header = findTableHeader(words)
    if (!header) continue

    const orderedEntries = (
      Object.entries(header.centers) as [keyof ColumnCenters, number][]
    ).sort((a, b) => a[1] - b[1])
    const orderedNames = orderedEntries.map(([n]) => n)
    const boundaries = midpointBoundaries(header.centers)
    const belowHeader = words.filter(
      (w) => w[1] > header.headerY + ROW_TOLERANCE
    )

    for (const row of clusterRows(belowHeader)) {
      const cols = assignColumns(row, orderedNames, boundaries)
      const lineTxt = cols.line_item
      const catTxt = cols.catalog
      const descTxt = cols.description
      const qtyTxt = cols.quantity

      if (descTxt.startsWith("***")) {
        currentItem = null
        continue
      }

      if (
        !lineTxt &&
        !catTxt &&
        descTxt.toLowerCase().startsWith("page ")
      ) {
        continue
      }

      if (/^\d+$/.test(lineTxt)) {
        currentItem = {
          catalogId: catTxt || "N/A",
          descriptionParts: descTxt ? [descTxt] : [],
          lineNumber: lineTxt,
          quantity: /^\d+(\.\d+)?$/.test(qtyTxt) ? Number(qtyTxt) : 1,
        }
        catalogItems.push(currentItem)
      } else if (lineTxt.toUpperCase() === "N/A") {
        currentItem = null
      } else if (currentItem) {
        if (
          catTxt &&
          (currentItem.catalogId === "" ||
            currentItem.catalogId.toUpperCase() === "N/A") &&
          isValidCatalogId(catTxt)
        ) {
          currentItem.catalogId = catTxt
        }
        if (descTxt) currentItem.descriptionParts.push(descTxt)
      }
    }
  }

  const items: TravelerCatalogItem[] = []
  const seenIds = new Set<string>()
  for (const item of catalogItems) {
    const catalogId = item.catalogId.trim() || "N/A"
    if (catalogId.toUpperCase() !== "N/A") {
      if (seenIds.has(catalogId)) continue
      seenIds.add(catalogId)
    }
    const description =
      item.descriptionParts.join(" ").replace(/\s+/g, " ").trim() || "N/A"
    items.push({
      catalogId,
      description,
      structureNumber: extractStructureNumber(description),
      lineNumber: item.lineNumber,
      quantity: item.quantity ?? 1,
    })
  }
  return items
}

function findCatalogIdPositions(lines: string[]): number[] {
  const positions: number[] = []
  for (let i = 0; i < lines.length - 2; i++) {
    const a = lines[i]!.trim()
    const b = lines[i + 1]!.trim()
    const c = lines[i + 2]!.trim()
    if (isCodeLine(a) && isCodeLine(b) && isCodeLine(c) && isValidCatalogId(c)) {
      positions.push(i + 2)
    }
  }
  return positions
}

function findDescriptionForCatalogId(
  lines: string[],
  catalogIndex: number
): string {
  const catalogId = lines[catalogIndex]!.trim()

  function collectForward(): string[] {
    const out: string[] = []
    let j = catalogIndex + 1
    while (j < lines.length) {
      const line = lines[j]!.trim()
      if (!line) {
        j++
        continue
      }
      if (isCodeLine(line) || isPreambleLine(line)) break
      if (line.startsWith("***")) break
      if (!isDescriptionLine(line)) break
      out.push(line)
      j++
    }
    return out
  }

  function collectBackward(): string[] {
    const out: string[] = []
    let k = catalogIndex - 3
    while (k >= 0) {
      const line = lines[k]!.trim()
      if (!line) {
        k--
        continue
      }
      if (isPreambleLine(line)) {
        k--
        continue
      }
      if (isCodeLine(line)) break
      if (line.startsWith("***")) break
      if (isDescriptionLine(line)) {
        out.push(line)
        k--
        continue
      }
      break
    }
    out.reverse()
    return out
  }

  const backward = collectBackward()
  if (backward.length && backward[0]!.startsWith(catalogId)) {
    return backward.join(" ")
  }

  const forward = collectForward()
  if (forward.length) return forward.join(" ")
  if (backward.length) return backward.join(" ")
  return "N/A"
}

type BareCodeRow = {
  lineNumber: string
  quantity: number
  catalogId: string
  index: number
}

function extractQbTableItems(text: string): TravelerCatalogItem[] {
  const lines = text.split(/\r?\n/)
  const items: TravelerCatalogItem[] = []
  const claimedLineNumbers = new Set<string>()

  const fullRowRe = new RegExp(
    `^(.+?)[\\t ]+(\\d{1,4})[\\t ]+(\\d+(?:\\.\\d+)?)[\\t ]+${CATALOG_ID_TOKEN}\\s*$`,
    "i"
  )

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i]!.match(fullRowRe)
    if (!match) continue
    let description = match[1]!.trim()
    if (
      /^description$/i.test(description) ||
      description.includes("Line Item") ||
      description.startsWith("***")
    ) {
      continue
    }
    description = description.replace(/\s+/g, " ").trim()
    const catalogId = match[4]!.replace(/\s+/g, "-").toUpperCase()
    if (!isValidCatalogId(catalogId)) continue
    const lineNumber = match[2]!
    claimedLineNumbers.add(lineNumber)
    items.push({
      catalogId,
      description: description || "N/A",
      structureNumber: extractStructureNumber(description),
      lineNumber,
      quantity: Number(match[3]) || 1,
    })
  }

  const bareRe = new RegExp(
    `^(\\d{1,4})[\\t ]+(\\d+(?:\\.\\d+)?)[\\t ]+${CATALOG_ID_TOKEN}\\s*$`,
    "i"
  )
  const bareRows: BareCodeRow[] = []
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i]!.match(bareRe)
    if (!match) continue
    const lineNumber = match[1]!
    if (claimedLineNumbers.has(lineNumber)) continue
    const catalogId = match[3]!.replace(/\s+/g, "-").toUpperCase()
    if (!isValidCatalogId(catalogId)) continue
    bareRows.push({
      lineNumber,
      quantity: Number(match[2]) || 1,
      catalogId,
      index: i,
    })
  }

  const descCandidates: { index: number; text: string; catalogPrefix: string }[] =
    []
  const absorbedIndexes = new Set<number>()
  for (let i = 0; i < lines.length; i++) {
    if (absorbedIndexes.has(i)) continue
    const raw = lines[i]!.trim()
    if (!raw || raw.startsWith("***") || bareRe.test(raw) || fullRowRe.test(raw)) {
      continue
    }
    if (/^\(MK-[A-Z0-9]+\)$/i.test(raw)) {
      const prev = descCandidates[descCandidates.length - 1]
      if (prev && !prev.text.includes(raw)) {
        prev.text = `${prev.text} ${raw}`.replace(/\s+/g, " ").trim()
      }
      continue
    }
    if (!isDescriptionLine(raw)) continue
    let text = raw
    if (
      i + 1 < lines.length &&
      /^\(MK-[A-Z0-9]+\)$/i.test(lines[i + 1]!.trim())
    ) {
      text = `${raw} ${lines[i + 1]!.trim()}`
      absorbedIndexes.add(i + 1)
    }
    const prefixMatch = text.match(/^([A-Z]{2,6}[-\s]?\d{3,6}[A-Z]{0,2}|\d{5,})/i)
    descCandidates.push({
      index: i,
      text: text.replace(/\s+/g, " ").trim(),
      catalogPrefix: prefixMatch
        ? prefixMatch[1]!.replace(/\s+/g, "-").toUpperCase()
        : "",
    })
  }

  const usedDescIndexes = new Set<number>()

  for (const bare of bareRows) {
    let description = "N/A"
    for (let j = bare.index - 1; j >= Math.max(0, bare.index - 3); j--) {
      const candidate = descCandidates.find((d) => d.index === j)
      if (!candidate || usedDescIndexes.has(candidate.index)) continue
      if (
        candidate.catalogPrefix &&
        candidate.catalogPrefix !== bare.catalogId &&
        candidate.catalogPrefix !== "N/A"
      ) {
        continue
      }
      description = candidate.text
      usedDescIndexes.add(candidate.index)
      break
    }

    if (description === "N/A") {
      const following = descCandidates.find(
        (d) =>
          d.index > bare.index &&
          !usedDescIndexes.has(d.index) &&
          d.catalogPrefix === bare.catalogId
      )
      if (following) {
        description = following.text
        usedDescIndexes.add(following.index)
      }
    }

    claimedLineNumbers.add(bare.lineNumber)
    items.push({
      catalogId: bare.catalogId,
      description,
      structureNumber: extractStructureNumber(description),
      lineNumber: bare.lineNumber,
      quantity: bare.quantity,
    })
  }

  items.sort((a, b) => {
    const an = Number(a.lineNumber) || 0
    const bn = Number(b.lineNumber) || 0
    return an - bn
  })

  return items
}

function extractLegacyTripleCodeItems(lines: string[]): TravelerCatalogItem[] {
  const positions = findCatalogIdPositions(lines)
  const catalogItems: TravelerCatalogItem[] = []

  for (const pos of positions) {
    const catalogId = lines[pos]!.trim()
    const qtyRaw = lines[pos - 1]!.trim()
    const lineRaw = lines[pos - 2]!.trim()
    const description = findDescriptionForCatalogId(lines, pos)
    catalogItems.push({
      catalogId,
      description,
      structureNumber: extractStructureNumber(description),
      lineNumber: /^\d+$/.test(lineRaw) ? lineRaw : undefined,
      quantity: /^\d+(\.\d+)?$/.test(qtyRaw) ? Number(qtyRaw) : 1,
    })
  }
  return catalogItems
}

function isQbWorkOrder(text: string): boolean {
  const upper = text.toUpperCase()
  return (
    upper.includes("WORK ORDER") &&
    (upper.includes("QB SALES ORDER") ||
      upper.includes("CATALOG ID") ||
      upper.includes("QB FABRICATION"))
  )
}

function finalizeCatalogIds(items: TravelerCatalogItem[]): string {
  const real = items
    .map((i) => i.catalogId)
    .filter((id) => id.toUpperCase() !== "N/A")
  return real.length ? real.join(", ") : "N/A"
}

export function extractFieldsFromText(text: string): ParsedWorkOrder {
  const lines = text.split(/\r?\n/)
  const header = extractHeaderFromText(text)

  let catalogItems: TravelerCatalogItem[] = []
  if (isQbWorkOrder(text)) {
    catalogItems = extractQbTableItems(text)
  }
  if (!catalogItems.length) {
    catalogItems = extractLegacyTripleCodeItems(lines)
  }

  for (const item of catalogItems) {
    if (!item.structureNumber && item.description) {
      item.structureNumber = extractStructureNumber(item.description)
    }
  }

  return {
    ...header,
    catalogIds: finalizeCatalogIds(catalogItems),
    catalogItems,
  }
}

export async function parseWorkOrderPdf(
  buffer: Buffer
): Promise<ParsedWorkOrder> {
  const { extractPdfPlainText, extractPdfWordsAndText } = await import(
    "@/lib/travelers/pdf-words"
  )

  // pdf-parse text is best for header labels / text-order fallback.
  let plainText = ""
  try {
    plainText = await extractPdfPlainText(buffer)
  } catch {
    plainText = ""
  }

  try {
    const { wordsByPage } = await extractPdfWordsAndText(buffer)
    const positionalItems = extractPositionalItems(wordsByPage)
    if (positionalItems.length) {
      for (const item of positionalItems) {
        if (!item.structureNumber && item.description) {
          item.structureNumber = extractStructureNumber(item.description)
        }
      }
      const header = extractHeaderFromText(plainText || "")
      return {
        ...header,
        catalogIds: finalizeCatalogIds(positionalItems),
        catalogItems: positionalItems,
      }
    }
  } catch {
    // Fall through to text parsers.
  }

  if (plainText.trim()) {
    return extractFieldsFromText(plainText)
  }

  return extractFieldsFromText("")
}
