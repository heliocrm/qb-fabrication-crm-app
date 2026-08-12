/**
 * Drawing packet stamp engine (Trevor stamp_engine.py port).
 * UI-free PDF geometry using pdf-lib. Used by DrawingPacketStudio.
 */

import {
  PDFDocument,
  rgb,
  degrees,
  StandardFonts,
  type PDFPage,
  type PDFImage,
  type PDFFont,
} from "pdf-lib"

export const STAMP_MARGIN = 38
export const ROTATION_IS_CLOCKWISE = true

export type Rect = { x0: number; y0: number; x1: number; y1: number }

export type PacketSettings = {
  totalPages: number
  positions: Record<number, { x: number; y: number } | null>
  sizes: Record<number, number>
  stampRotations: Record<number, number>
  crops: Record<number, Rect | null>
  marginSide: Record<number, "left" | "right">
  marginLeft: Record<number, number>
  marginRight: Record<number, number>
  finalRotation: Record<number, number>
}

export function createPacketSettings(totalPages: number): PacketSettings {
  const settings: PacketSettings = {
    totalPages,
    positions: {},
    sizes: {},
    stampRotations: {},
    crops: {},
    marginSide: {},
    marginLeft: {},
    marginRight: {},
    finalRotation: {},
  }
  for (let i = 0; i < totalPages; i++) {
    resetPageSettings(settings, i)
  }
  return settings
}

export function resetPageSettings(settings: PacketSettings, i: number) {
  settings.positions[i] = null
  settings.sizes[i] = 20
  settings.stampRotations[i] = 90
  settings.crops[i] = null
  settings.marginSide[i] = "left"
  settings.marginLeft[i] = STAMP_MARGIN
  settings.marginRight[i] = STAMP_MARGIN
  settings.finalRotation[i] = 0
}

export function removePageSettings(settings: PacketSettings, i: number) {
  settings.totalPages -= 1
  const keys = [
    "positions",
    "sizes",
    "stampRotations",
    "crops",
    "marginSide",
    "marginLeft",
    "marginRight",
    "finalRotation",
  ] as const
  for (const key of keys) {
    const dict = settings[key] as Record<number, unknown>
    for (let j = i; j < settings.totalPages; j++) {
      dict[j] = dict[j + 1]
    }
    delete dict[settings.totalPages]
  }
}

const DIRECTIONS: Record<number, [[number, number], [number, number]]> = {
  0: [
    [1, 0],
    [0, -1],
  ],
  90: [
    [0, -1],
    [-1, 0],
  ],
  180: [
    [-1, 0],
    [0, 1],
  ],
  270: [
    [0, 1],
    [1, 0],
  ],
}

function rectW(r: Rect) {
  return r.x1 - r.x0
}
function rectH(r: Rect) {
  return r.y1 - r.y0
}

export function pageRegion(settings: PacketSettings, i: number, pageRect: Rect): Rect {
  return settings.crops[i] ?? pageRect
}

export function stripsFor(
  settings: PacketSettings,
  i: number,
  region: Rect
): { stampStrip: Rect; safetyStrip: Rect } {
  const lw = settings.marginLeft[i] ?? STAMP_MARGIN
  const rw = settings.marginRight[i] ?? STAMP_MARGIN
  const left: Rect = {
    x0: region.x0 - lw,
    y0: region.y0,
    x1: region.x0,
    y1: region.y1,
  }
  const right: Rect = {
    x0: region.x1,
    y0: region.y0,
    x1: region.x1 + rw,
    y1: region.y1,
  }
  if (settings.marginSide[i] === "right") {
    return { stampStrip: right, safetyStrip: left }
  }
  return { stampStrip: left, safetyStrip: right }
}

export function unrotatePoint(
  stampedPageRect: Rect,
  finalAngle: number,
  dx: number,
  dy: number
): { x: number; y: number } {
  const r = stampedPageRect
  const width = rectW(r)
  const height = rectH(r)
  let angle = finalAngle % 360
  if (!ROTATION_IS_CLOCKWISE) angle = (360 - angle) % 360

  if (angle === 0) return { x: r.x0 + dx, y: r.y0 + dy }
  if (angle === 90) return { x: r.x0 + dy, y: r.y0 + (height - dx) }
  if (angle === 180)
    return { x: r.x0 + (width - dx), y: r.y0 + (height - dy) }
  return { x: r.x0 + (width - dy), y: r.y0 + dx }
}

export async function combinePdfs(buffers: ArrayBuffer[]): Promise<Uint8Array> {
  const out = await PDFDocument.create()
  for (const buf of buffers) {
    const src = await PDFDocument.load(buf, { ignoreEncryption: true })
    const pages = await out.copyPages(src, src.getPageIndices())
    for (const page of pages) out.addPage(page)
  }
  return out.save()
}

export async function normalizePdf(bytes: Uint8Array): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true })
  const out = await PDFDocument.create()
  const indices = src.getPageIndices()
  for (const i of indices) {
    const [embedded] = await out.embedPages([src.getPage(i)])
    const w = embedded.width
    const h = embedded.height
    const page = out.addPage([w, h])
    page.drawPage(embedded, { x: 0, y: 0, width: w, height: h })
  }
  return out.save()
}

export async function rotatePdfPages(
  bytes: Uint8Array,
  rotations: Record<number, number>
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
  const pages = doc.getPages()
  pages.forEach((page, i) => {
    const angle = rotations[i] ?? 0
    if (angle) page.setRotation(degrees(angle))
  })
  return doc.save()
}

function approxTextWidth(text: string, fontSize: number): number {
  // Helvetica average glyph width ~0.5em
  return text.length * fontSize * 0.5
}

export async function stampPdf(
  sourceBytes: Uint8Array,
  revNumber: string,
  orderDate: string,
  settings: PacketSettings,
  signaturePng?: Uint8Array | null
): Promise<Uint8Array> {
  const src = await PDFDocument.load(sourceBytes, { ignoreEncryption: true })
  const out = await PDFDocument.create()
  const font = await out.embedFont(StandardFonts.Helvetica)
  let signatureImage: PDFImage | null = null
  let sigAspect = 3
  if (signaturePng?.length) {
    try {
      signatureImage = await out.embedPng(signaturePng)
      sigAspect = signatureImage.width / signatureImage.height
    } catch {
      signatureImage = null
    }
  }

  const prefix = `DRAWINGS ISSUED FOR QB FABRICATION   Rev: ${revNumber}   Signature: `
  const suffix = `   Date: ${orderDate}`
  const fallbackSigName = "Andrey Deyna"

  const pageCount = src.getPageCount()
  for (let i = 0; i < pageCount; i++) {
    const [embedded] = await out.embedPages([src.getPage(i)])
    const pageW = embedded.width
    const pageH = embedded.height
    const full: Rect = { x0: 0, y0: 0, x1: pageW, y1: pageH }
    const region = pageRegion(settings, i, full)
    const { stampStrip, safetyStrip } = stripsFor(settings, i, region)

    const union = {
      x0: Math.min(region.x0, stampStrip.x0, safetyStrip.x0),
      y0: Math.min(region.y0, stampStrip.y0, safetyStrip.y0),
      x1: Math.max(region.x1, stampStrip.x1, safetyStrip.x1),
      y1: Math.max(region.y1, stampStrip.y1, safetyStrip.y1),
    }
    const newW = union.x1 - union.x0
    const newH = union.y1 - union.y0
    const page = out.addPage([newW, newH])

    // Shift so union origin maps to 0,0
    const ox = -union.x0
    const oy = -union.y0

    // Draw cropped source content
    page.drawPage(embedded, {
      x: ox,
      y: oy,
      width: pageW,
      height: pageH,
    })

    // White underlays for strips overlapping original content
    for (const s of [stampStrip, safetyStrip]) {
      const under: Rect = {
        x0: Math.max(s.x0, 0),
        y0: Math.max(s.y0, 0),
        x1: Math.min(s.x1, pageW),
        y1: Math.min(s.y1, pageH),
      }
      if (under.x1 > under.x0 && under.y1 > under.y0) {
        page.drawRectangle({
          x: under.x0 + ox,
          y: under.y0 + oy,
          width: under.x1 - under.x0,
          height: under.y1 - under.y0,
          color: rgb(1, 1, 1),
          borderWidth: 0,
        })
      }
    }

    // Also paint full stamp/safety strips white (outside original page)
    for (const s of [stampStrip, safetyStrip]) {
      page.drawRectangle({
        x: s.x0 + ox,
        y: s.y0 + oy,
        width: s.x1 - s.x0,
        height: s.y1 - s.y0,
        color: rgb(1, 1, 1),
        borderWidth: 0,
      })
    }

    const fontsize = settings.sizes[i] ?? 20
    const rotation = settings.stampRotations[i] ?? 90
    const [d, u] = DIRECTIONS[rotation] ?? DIRECTIONS[90]!

    const prefixLen = approxTextWidth(prefix, fontsize)
    let sigWidth: number
    let sigHeight: number
    let baselineDrop = 0
    if (signatureImage) {
      sigHeight = fontsize * 1.6
      sigWidth = sigHeight * sigAspect
      baselineDrop = sigHeight * 0.45
    } else {
      sigWidth = approxTextWidth(fallbackSigName, fontsize)
      sigHeight = fontsize
    }
    const suffixLen = approxTextWidth(suffix, fontsize)
    const totalLen = prefixLen + sigWidth + suffixLen

    let ax: number
    let ay: number
    const position = settings.positions[i]
    if (!position) {
      if (rotation === 90) {
        ax = stampStrip.x1 - 10
        ay = region.y0 + rectH(region) / 2 + totalLen / 2
      } else if (rotation === 270) {
        ax = stampStrip.x0 + 10
        ay = region.y0 + rectH(region) / 2 - totalLen / 2
      } else if (rotation === 180) {
        ax = region.x0 + rectW(region) / 2 + totalLen / 2
        ay = region.y1 - 15
      } else {
        ax = region.x0 + rectW(region) / 2 - totalLen / 2
        ay = region.y0 + 20
      }
    } else {
      ax = position.x
      ay = position.y
    }

    drawRotatedText(page, font, prefix, ax + ox, ay + oy, fontsize, rotation)

    const sigStartX = ax + d[0]! * prefixLen - u[0]! * baselineDrop
    const sigStartY = ay + d[1]! * prefixLen - u[1]! * baselineDrop

    if (signatureImage) {
      const cornerX = sigStartX + d[0]! * sigWidth + u[0]! * sigHeight
      const cornerY = sigStartY + d[1]! * sigWidth + u[1]! * sigHeight
      const sx0 = Math.min(sigStartX, cornerX) + ox
      const sy0 = Math.min(sigStartY, cornerY) + oy
      const sw = Math.abs(cornerX - sigStartX)
      const sh = Math.abs(cornerY - sigStartY)
      page.drawImage(signatureImage, {
        x: sx0,
        y: sy0,
        width: sw || sigWidth,
        height: sh || sigHeight,
        rotate: degrees(rotation),
      })
    } else {
      drawRotatedText(
        page,
        font,
        fallbackSigName,
        sigStartX + ox,
        sigStartY + oy,
        fontsize,
        rotation
      )
    }

    const afterSig = prefixLen + sigWidth
    drawRotatedText(
      page,
      font,
      suffix,
      ax + d[0]! * afterSig + ox,
      ay + d[1]! * afterSig + oy,
      fontsize,
      rotation
    )
  }

  return out.save()
}

function drawRotatedText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  size: number,
  rotation: number
) {
  page.drawText(text, {
    x,
    y,
    size,
    font,
    color: rgb(1, 0, 0),
    rotate: degrees(rotation),
  })
}

export async function stampAndRotate(
  sourceBytes: Uint8Array,
  revNumber: string,
  orderDate: string,
  settings: PacketSettings,
  signaturePng?: Uint8Array | null
): Promise<Uint8Array> {
  const stamped = await stampPdf(
    sourceBytes,
    revNumber,
    orderDate,
    settings,
    signaturePng
  )
  return rotatePdfPages(stamped, settings.finalRotation)
}

export type CropTemplateData = {
  crop: [number, number, number, number] // proportional 0..1
  marginSide: "left" | "right"
  marginLeft: number
  marginRight: number
}

export function cropFromTemplate(
  template: CropTemplateData,
  pageRect: Rect
): Rect {
  const [rx0, ry0, rx1, ry1] = template.crop
  const w = rectW(pageRect)
  const h = rectH(pageRect)
  return {
    x0: pageRect.x0 + rx0 * w,
    y0: pageRect.y0 + ry0 * h,
    x1: pageRect.x0 + rx1 * w,
    y1: pageRect.y0 + ry1 * h,
  }
}

export function cropToProportions(crop: Rect, pageRect: Rect): [number, number, number, number] {
  const w = rectW(pageRect) || 1
  const h = rectH(pageRect) || 1
  return [
    (crop.x0 - pageRect.x0) / w,
    (crop.y0 - pageRect.y0) / h,
    (crop.x1 - pageRect.x0) / w,
    (crop.y1 - pageRect.y0) / h,
  ]
}
