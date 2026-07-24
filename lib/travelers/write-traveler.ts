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

/**
 * Builds a QB traveler .docx matching the fields from Trevor's MVP writer.
 * Official Word styling can be swapped later when QB_Traveler_Master_Copy.docx
 * is placed under assets/travelers/.
 */
export async function buildTravelerDocx(
  fields: TravelerGenerateFields
): Promise<Buffer> {
  const catalogIds = fields.catalogItems.map((i) => i.catalogId).join(", ")
  const structureNumbers = fields.catalogItems
    .map((i) => i.structureNumber.trim() || "N/A")
    .join(", ")

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
                      fieldParagraph(
                        "Document #: TRV-",
                        fields.customerPo
                      ),
                      fieldParagraph("Rev Date:", fields.orderDate),
                      fieldParagraph("Rev #:", fields.revNumber || "0"),
                    ],
                    4680
                  ),
                  cell(
                    [fieldParagraph("DATE:", fields.orderDate)],
                    4680
                  ),
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
                  cell(
                    [fieldParagraph("Customer:", fields.customer)],
                    4680
                  ),
                  cell(
                    [
                      fieldParagraph(
                        "Structure #:",
                        structureNumbers,
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
                        fields.customerPo
                      ),
                    ],
                    4680
                  ),
                  cell(
                    [fieldParagraph("Start Date:", fields.orderDate)],
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
                        catalogIds || "N/A",
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
              new TextRun({
                text: "Line items",
                bold: true,
                size: 22,
              }),
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

export function travelerFilename(
  poNumber: string,
  version: number
): string {
  const safe = poNumber.replace(/[^\w.-]+/g, "_")
  if (version <= 1) return `TRV-${safe}.docx`
  return `TRV-${safe}_v${version}.docx`
}
