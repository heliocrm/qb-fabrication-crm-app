/**
 * Extract positioned words from a PDF buffer via pdfjs-dist.
 * Word shape mirrors PyMuPDF get_text("words"): [x0, y0, x1, y1, text]
 */

export type PdfWord = [number, number, number, number, string]

type TextItem = {
  str?: string
  transform?: number[]
  width?: number
  height?: number
  hasEOL?: boolean
}

export async function extractPdfWordsAndText(
  buffer: Buffer
): Promise<{ wordsByPage: PdfWord[][]; fullText: string }> {
  // Polyfill DOMMatrix for Node (same pattern as pdf-parse path).
  await import("@napi-rs/canvas").catch(() => undefined)

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
  const data = new Uint8Array(buffer)
  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true,
  })
  const doc = await loadingTask.promise
  const wordsByPage: PdfWord[][] = []
  const textParts: string[] = []

  try {
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum)
      const viewport = page.getViewport({ scale: 1 })
      const content = await page.getTextContent()
      const pageWords: PdfWord[] = []
      let pageText = ""

      for (const raw of content.items as TextItem[]) {
        const str = raw.str ?? ""
        const trimmed = str.trim()
        if (trimmed && raw.transform) {
          const [, , , , e, f] = raw.transform
          const x0 = e
          // pdf.js: transform[5] is baseline from bottom; convert to top-left y0
          const fontHeight = Math.abs(raw.transform[3] || raw.height || 10)
          const y1 = viewport.height - f
          const y0 = y1 - fontHeight
          const width = raw.width ?? trimmed.length * (fontHeight * 0.5)
          const x1 = x0 + width
          pageWords.push([x0, y0, x1, y1, trimmed])
        }
        pageText += str
        if (raw.hasEOL) pageText += "\n"
      }

      wordsByPage.push(pageWords)
      textParts.push(pageText)
    }
  } finally {
    ;(doc as { destroy?: () => void }).destroy?.()
  }

  return {
    wordsByPage,
    fullText: textParts.join("\n"),
  }
}

/** Reliable plain text via pdf-parse (line breaks better for header labels). */
export async function extractPdfPlainText(buffer: Buffer): Promise<string> {
  await import("pdf-parse/worker")
  const { PDFParse } = await import("pdf-parse")
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  try {
    const result = await parser.getText()
    return result.text ?? ""
  } finally {
    await parser.destroy().catch(() => undefined)
  }
}
