import type { DocumentType } from "@/types"

const EXT_TO_TYPE: Record<string, DocumentType> = {
  pdf: "Drawing",
  dwg: "Drawing",
  dxf: "Drawing",
  png: "Drawing",
  jpg: "Drawing",
  jpeg: "Drawing",
  xlsx: "Work Order",
  xls: "Work Order",
  doc: "Work Order",
  docx: "Work Order",
}

const NAME_PATTERNS: { pattern: RegExp; type: DocumentType }[] = [
  { pattern: /^trv[-_]/i, type: "Traveler" },
  { pattern: /traveler/i, type: "Traveler" },
  { pattern: /po[-_\s]?/i, type: "PO" },
  { pattern: /work[-_\s]?order|wo[-_\s]/i, type: "Work Order" },
  { pattern: /inspect|qc|weld|cert/i, type: "Inspection" },
  { pattern: /ship|bol|freight/i, type: "Shipping" },
  { pattern: /draw|dwg|dxf|rev/i, type: "Drawing" },
]

export function inferDocumentType(filename: string): DocumentType {
  for (const { pattern, type } of NAME_PATTERNS) {
    if (pattern.test(filename)) return type
  }

  const ext = filename.split(".").pop()?.toLowerCase()
  if (ext && EXT_TO_TYPE[ext]) return EXT_TO_TYPE[ext]

  return "Work Order"
}

export function isPreviewableMime(mimeType: string): boolean {
  return (
    mimeType.startsWith("image/") ||
    mimeType === "application/pdf" ||
    mimeType.startsWith("video/") ||
    mimeType.includes("google-apps")
  )
}

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/acad",
  "image/vnd.dwg",
  "application/octet-stream",
] as const

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

export function formatDriveFileSize(bytes?: number | null): string | undefined {
  if (bytes == null) return undefined
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}
