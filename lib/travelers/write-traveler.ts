import fs from "node:fs"
import path from "node:path"
import JSZip from "jszip"
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  BorderStyle,
} from "docx"
import type { TravelerGenerateFields } from "@/lib/travelers/types"

const WRAP_LINE_LENGTH = 55
const MASTER_TEMPLATE_PATH = path.join(
  process.cwd(),
  "assets",
  "travelers",
  "QB_Traveler_Master_Copy.docx"
)

function cleanValue(value: string): string {
  return value.replace(/\u00a0/g, " ").split(/\s+/).join(" ").trim()
}

function splitIntoLines(
  value: string,
  firstLineBudget: number,
  lineBudget: number
): string[] {
  const items = value
    .split(",")
    .map((item) => cleanValue(item))
    .filter(Boolean)

  const lines: string[] = []
  let current = ""
  let budget = firstLineBudget

  for (const item of items) {
    const candidate = current ? `${current}, ${item}` : item
    if (candidate.length <= budget || !current) {
      current = candidate
    } else {
      lines.push(`${current},`)
      current = item
      budget = lineBudget
    }
  }
  if (current) lines.push(current)
  return lines
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function paragraphPlainText(paragraphXml: string): string {
  return [...paragraphXml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map((m) => m[1] ?? "")
    .join("")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

function makeValueRuns(value: string, wrap: boolean, label: string, wrapLength: number): string {
  if (!wrap) {
    return `<w:r><w:t xml:space="preserve"> ${escapeXml(cleanValue(value))}</w:t></w:r>`
  }
  const firstBudget = Math.max(wrapLength - label.length, 12)
  const lines = splitIntoLines(value, firstBudget, wrapLength)
  return lines
    .map((line, i) => {
      const prefix = i === 0 ? " " : ""
      const br = i > 0 ? "<w:br/>" : ""
      return `<w:r>${br}<w:t xml:space="preserve">${escapeXml(prefix + line)}</w:t></w:r>`
    })
    .join("")
}

/**
 * Append value after the first paragraph whose plain text starts with `label`.
 * Mirrors Trevor traveler_writer.fill_field.
 */
function fillFieldInXml(
  xml: string,
  label: string,
  value: string,
  wrap = false,
  wrapLength = WRAP_LINE_LENGTH
): string {
  return xml.replace(/<w:p[\s\S]*?<\/w:p>/g, (paragraph) => {
    const plain = paragraphPlainText(paragraph).trim()
    if (!plain.startsWith(label)) return paragraph
    if (plain.length > label.length + 2) {
      // Already filled (re-export safety) — leave alone.
      const after = plain.slice(label.length).trim()
      if (after && after !== "0") return paragraph
    }
    const insert = makeValueRuns(value, wrap, label, wrapLength)
    return paragraph.replace(/<\/w:p>/, `${insert}</w:p>`)
  })
}

/** Replace baked-in Rev #:0 with the real rev (Trevor replace_field_value). */
function replaceRevInXml(xml: string, revNumber: string): string {
  return xml.replace(/<w:p[\s\S]*?<\/w:p>/g, (paragraph) => {
    const plain = paragraphPlainText(paragraph).trim()
    if (!plain.startsWith("Rev #:")) return paragraph
    return paragraph.replace(
      /(<w:t[^>]*>)([^<]*Rev #:)0(<\/w:t>)/,
      `$1$2${escapeXml(revNumber || "0")}$3`
    ).replace(
      /(<w:t[^>]*>)0(<\/w:t>)/,
      (full, open, close) => {
        // Only when paragraph is Rev #:0 split across runs
        if (plain === "Rev #:0" || plain.startsWith("Rev #:")) {
          return `${open}${escapeXml(revNumber || "0")}${close}`
        }
        return full
      }
    )
  })
}

function buildFieldValues(fields: TravelerGenerateFields) {
  const realCatalogIds = fields.catalogItems
    .map((i) => i.catalogId.trim())
    .filter((id) => id && id.toUpperCase() !== "N/A")
  const realStructures = fields.catalogItems
    .map((i) => i.structureNumber.trim())
    .filter((s) => s && s.toUpperCase() !== "N/A")

  return {
    customerPo: fields.customerPo,
    orderDate: fields.orderDate,
    customer: fields.customer,
    revNumber: fields.revNumber || "0",
    catalogIds: realCatalogIds.length ? realCatalogIds.join(", ") : "N/A",
    structureNumbers: realStructures.length
      ? realStructures.join(", ")
      : "N/A",
  }
}

/**
 * Fill the official QB traveler master DOCX (Trevor traveler_writer parity).
 */
export async function fillTravelerMasterDocx(
  fields: TravelerGenerateFields
): Promise<Buffer | null> {
  if (!fs.existsSync(MASTER_TEMPLATE_PATH)) return null

  const values = buildFieldValues(fields)
  const zip = await JSZip.loadAsync(fs.readFileSync(MASTER_TEMPLATE_PATH))
  const docFile = zip.file("word/document.xml")
  if (!docFile) return null

  let xml = await docFile.async("string")
  xml = fillFieldInXml(xml, "Document #: TRV-", values.customerPo)
  xml = fillFieldInXml(xml, "Document #:", values.customerPo) // page 2 split label
  xml = fillFieldInXml(xml, "Rev Date", values.orderDate)
  xml = replaceRevInXml(xml, values.revNumber)
  xml = fillFieldInXml(xml, "DATE:", values.orderDate)
  xml = fillFieldInXml(xml, "Customer:", values.customer)
  xml = fillFieldInXml(xml, "Job Number", values.customerPo)
  xml = fillFieldInXml(xml, "Structure #", values.structureNumbers, true, 45)
  xml = fillFieldInXml(xml, "Part / Assembly", values.catalogIds, true)
  xml = fillFieldInXml(xml, "Start Date", values.orderDate)

  zip.file("word/document.xml", xml)
  const out = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  })
  return Buffer.from(out)
}

function fieldParagraph(label: string, value: string, wrap = false): Paragraph {
  const cleaned = cleanValue(value) || "N/A"
  if (!wrap) {
    return new Paragraph({
      children: [
        new TextRun({ text: `${label} `, bold: true, size: 20 }),
        new TextRun({ text: cleaned, size: 20 }),
      ],
    })
  }

  const firstBudget = Math.max(WRAP_LINE_LENGTH - label.length, 12)
  const lines = splitIntoLines(cleaned, firstBudget, WRAP_LINE_LENGTH)
  const children: TextRun[] = [
    new TextRun({ text: `${label} `, bold: true, size: 20 }),
  ]
  lines.forEach((line, i) => {
    if (i > 0) children.push(new TextRun({ break: 1, text: "", size: 20 }))
    children.push(new TextRun({ text: line, size: 20 }))
  })
  return new Paragraph({ children })
}

function cell(children: Paragraph[], width = 4500): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
    },
    children,
  })
}

/** Synthetic DOCX fallback when the master template is missing. */
async function buildSyntheticTravelerDocx(
  fields: TravelerGenerateFields
): Promise<Buffer> {
  const values = buildFieldValues(fields)

  const doc = new Document({
    creator: "QB Fabrication CRM",
    title: `TRV-${fields.customerPo}`,
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "QB Fabrication & Welding — Traveler",
                bold: true,
                size: 28,
              }),
            ],
            spacing: { after: 200 },
          }),
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            rows: [
              new TableRow({
                children: [
                  cell(
                    [
                      fieldParagraph("Document #: TRV-", values.customerPo),
                      fieldParagraph("Rev Date:", values.orderDate),
                      fieldParagraph("Rev #:", values.revNumber),
                    ],
                    4680
                  ),
                  cell([fieldParagraph("DATE:", values.orderDate)], 4680),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "", spacing: { after: 200 } }),
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            rows: [
              new TableRow({
                children: [
                  cell([fieldParagraph("Customer:", values.customer)], 4680),
                  cell(
                    [
                      fieldParagraph(
                        "Structure #:",
                        values.structureNumbers,
                        true
                      ),
                    ],
                    4680
                  ),
                ],
              }),
              new TableRow({
                children: [
                  cell(
                    [
                      fieldParagraph(
                        "Job Number / P.O.#:",
                        values.customerPo
                      ),
                    ],
                    4680
                  ),
                  cell(
                    [fieldParagraph("Start Date:", values.orderDate)],
                    4680
                  ),
                ],
              }),
              new TableRow({
                children: [
                  cell(
                    [
                      fieldParagraph(
                        "Part / Assembly / Catalog ID:",
                        values.catalogIds,
                        true
                      ),
                    ],
                    9360
                  ),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "", spacing: { before: 400, after: 120 } }),
          new Paragraph({
            children: [
              new TextRun({ text: "Line items", bold: true, size: 22 }),
            ],
          }),
          ...fields.catalogItems.map(
            (item, index) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${index + 1}. ${item.catalogId} — ${cleanValue(item.description) || "N/A"} (Structure: ${item.structureNumber.trim() || "N/A"})`,
                    size: 18,
                  }),
                ],
                spacing: { after: 60 },
              })
          ),
        ],
      },
    ],
  })

  return Buffer.from(await Packer.toBuffer(doc))
}

/**
 * Prefer official master template fill; fall back to synthetic DOCX.
 */
export async function buildTravelerDocx(
  fields: TravelerGenerateFields
): Promise<Buffer> {
  try {
    const filled = await fillTravelerMasterDocx(fields)
    if (filled) return filled
  } catch (err) {
    console.warn("Master traveler DOCX fill failed; using synthetic:", err)
  }
  return buildSyntheticTravelerDocx(fields)
}

export function travelerFilename(
  poNumber: string,
  version: number
): string {
  const safe = poNumber.replace(/[^\w.-]+/g, "_")
  if (version <= 1) return `TRV-${safe}.docx`
  return `TRV-${safe}_v${version}.docx`
}
