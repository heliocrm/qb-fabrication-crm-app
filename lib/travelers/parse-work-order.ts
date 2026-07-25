import { resolveCustomerName } from "@/lib/travelers/customer-map"
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

function isCodeLine(line: string): boolean {
  const stripped = line.trim()
  if (!stripped) return false
  if (/^\d+$/.test(stripped)) return true
  if (stripped.toUpperCase() === "N/A") return true
  return ALPHA_CATALOG_ID.test(stripped.toUpperCase())
}

function isCatalogId(value: string): boolean {
  const stripped = value.trim()
  if (!stripped) return false
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

function extractStructureNumber(description: string): string {
  const match = description.match(MARK_IN_PARENS)
  return match?.[1]?.toUpperCase() ?? ""
}

function fieldAfter(label: string, lines: string[]): string | null {
  for (const line of lines) {
    if (line.includes(label)) {
      return line.split(label)[1]?.trim() || null
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

function findCatalogIdPositions(lines: string[]): number[] {
  const positions: number[] = []
  for (let i = 0; i < lines.length - 2; i++) {
    const a = lines[i]!.trim()
    const b = lines[i + 1]!.trim()
    const c = lines[i + 2]!.trim()
    if (isCodeLine(a) && isCodeLine(b) && isCodeLine(c) && isCatalogId(c)) {
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

/**
 * QB-issued WO table rows often land as:
 *   Description…\tLine# Qty\tCatalogID
 * or description on prior/following lines with bare `Line# Qty\tCatalogID`.
 */
function extractQbTableItems(text: string): TravelerCatalogItem[] {
  const lines = text.split(/\r?\n/)
  const items: TravelerCatalogItem[] = []
  const claimedLineNumbers = new Set<string>()

  // 1) Full rows: description + line# + qty + catalog on one line
  const fullRowRe =
    /^(.+?)[\t ]+(\d{1,4})[\t ]+(\d+(?:\.\d+)?)[\t ]+([A-Z]{2,6}[-\s]?\d{3,6}[A-Z]{0,2}|N\/A)\s*$/i

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

  // 2) Bare code rows: `6 9\tSNST-0552`
  const bareRe =
    /^(\d{1,4})[\t ]+(\d+(?:\.\d+)?)[\t ]+([A-Z]{2,6}[-\s]?\d{3,6}[A-Z]{0,2}|N\/A)\s*$/i
  const bareRows: BareCodeRow[] = []
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i]!.match(bareRe)
    if (!match) continue
    const lineNumber = match[1]!
    if (claimedLineNumbers.has(lineNumber)) continue
    bareRows.push({
      lineNumber,
      quantity: Number(match[2]) || 1,
      catalogId: match[3]!.replace(/\s+/g, "-").toUpperCase(),
      index: i,
    })
  }

  // Description candidates: lines that look like catalog descriptions
  const descCandidates: { index: number; text: string; catalogPrefix: string }[] =
    []
  const absorbedIndexes = new Set<number>()
  for (let i = 0; i < lines.length; i++) {
    if (absorbedIndexes.has(i)) continue
    const raw = lines[i]!.trim()
    if (!raw || raw.startsWith("***") || bareRe.test(raw) || fullRowRe.test(raw)) {
      continue
    }
    // Mark-only lines attach to the previous description candidate
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
    const prefixMatch = text.match(/^([A-Z]{2,6}[-\s]?\d{3,6}[A-Z]{0,2})/i)
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
    // Prefer description immediately above (within 3 lines)
    let description = "N/A"
    for (let j = bare.index - 1; j >= Math.max(0, bare.index - 3); j--) {
      const candidate = descCandidates.find((d) => d.index === j)
      if (!candidate || usedDescIndexes.has(candidate.index)) continue
      // Skip if this candidate belongs to a different catalog and a better match exists later
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

    // Else first unused following description that starts with this catalog ID
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

  // Sort by WO line number when available
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
    const structureNumber = extractStructureNumber(description)
    catalogItems.push({
      catalogId,
      description,
      structureNumber,
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

export function extractFieldsFromText(text: string): ParsedWorkOrder {
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

  let catalogItems: TravelerCatalogItem[] = []
  if (isQbWorkOrder(text)) {
    catalogItems = extractQbTableItems(text)
  }
  if (!catalogItems.length) {
    catalogItems = extractLegacyTripleCodeItems(lines)
  }

  // Attach orphan mark-only lines to previous item when description split
  // e.g. "(MK-0552H)" on its own line before "6 9 SNST-0552"
  for (let i = 0; i < catalogItems.length; i++) {
    const item = catalogItems[i]!
    if (!item.structureNumber && item.description) {
      item.structureNumber = extractStructureNumber(item.description)
    }
  }

  const catalogIds = catalogItems.length
    ? catalogItems.map((i) => i.catalogId).join(", ")
    : "N/A"

  return {
    customerPo,
    orderDate,
    customer,
    catalogIds,
    catalogItems,
    qbSalesOrder,
    shipDate,
  }
}

export async function parseWorkOrderPdf(
  buffer: Buffer
): Promise<ParsedWorkOrder> {
  // Worker must load first so @napi-rs/canvas polyfills DOMMatrix for pdfjs.
  await import("pdf-parse/worker")
  const { PDFParse } = await import("pdf-parse")
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  try {
    const result = await parser.getText()
    const text = result.text ?? ""
    return extractFieldsFromText(text)
  } finally {
    await parser.destroy().catch(() => undefined)
  }
}
