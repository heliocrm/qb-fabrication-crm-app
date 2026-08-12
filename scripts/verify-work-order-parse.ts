/**
 * Smoke fixture for WO parser. Run:
 *   pnpm exec tsx scripts/verify-work-order-parse.ts [path-to.pdf]
 */
import fs from "node:fs"
import path from "node:path"
import { parseWorkOrderPdf } from "../lib/travelers/parse-work-order"

async function main() {
  const arg = process.argv[2]
  const candidates = [
    arg,
    path.join("data", "docs", "WO_0000081199.pdf"),
  ].filter(Boolean) as string[]

  const pdfPath = candidates.find((p) => fs.existsSync(p))
  if (!pdfPath) {
    console.error("No WO PDF found. Pass a path or place data/docs/WO_*.pdf")
    process.exit(1)
  }

  const buf = fs.readFileSync(pdfPath)
  const parsed = await parseWorkOrderPdf(buf)
  console.log("File:", pdfPath)
  console.log("Customer:", parsed.customer)
  console.log("PO:", parsed.customerPo)
  console.log("Order date:", parsed.orderDate)
  console.log("QB SO:", parsed.qbSalesOrder)
  console.log("Ship date:", parsed.shipDate)
  console.log("Lines:", parsed.catalogItems.length)
  for (const item of parsed.catalogItems.slice(0, 20)) {
    console.log(
      `  [${item.lineNumber ?? "?"}] ${item.catalogId} qty=${item.quantity ?? 1} struct=${item.structureNumber || "(empty)"}`
    )
    console.log(`      ${item.description.slice(0, 100)}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
