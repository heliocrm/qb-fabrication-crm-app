import { resolveCustomerName } from "@/lib/travelers/customer-map"
import type { ParsedWorkOrder, TravelerCatalogItem } from "@/lib/travelers/types"

/** Alphanumeric catalog IDs (PGE-style): TRNR-0501, GRND-0500, MK-0550H */
const ALPHA_CATALOG_ID = /^[A-Z]{2,6}[-\s]?\d{3,6}[A-Z]{0,2}$/

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

function findCatalogIdPositions(lines: string[]): number[] {
  const positions: number[] = []
  for (let i = 0; i < lines.length - 2; i++) {
    const a = lines[i]!.trim()
    const b = lines[i + 1]!.trim()
    const c = lines[i + 2]!.trim()
    if (isCodeLine(a) && isCodeLine(b) && isCodeLine(c)) {
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

export function extractFieldsFromText(text: string): ParsedWorkOrder {
  const lines = text.split("\n")

  let customerPo = "N/A"
  for (const line of lines) {
    if (line.includes("Customer PO:")) {
      customerPo = line.split("Customer PO:")[1]?.trim() || "N/A"
      break
    }
  }

  let orderDate = "N/A"
  for (const line of lines) {
    if (line.includes("Order Date:")) {
      orderDate = line.split("Order Date:")[1]?.trim() || "N/A"
      break
    }
  }

  let customer = "N/A"
  for (const line of lines) {
    if (line.includes("Bill To:")) {
      const raw = line.split("Bill To:")[1]?.trim() || ""
      customer = resolveCustomerName(raw)
      break
    }
  }

  const positions = findCatalogIdPositions(lines)
  const catalogItems: TravelerCatalogItem[] = []
  const seenIds = new Set<string>()

  for (const pos of positions) {
    const catalogId = lines[pos]!.trim()
    if (seenIds.has(catalogId)) continue
    seenIds.add(catalogId)
    catalogItems.push({
      catalogId,
      description: findDescriptionForCatalogId(lines, pos),
      structureNumber: "",
    })
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
  }
}

export async function parseWorkOrderPdf(
  buffer: Buffer
): Promise<ParsedWorkOrder> {
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
