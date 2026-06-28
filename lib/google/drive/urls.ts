/** Google Drive URL builders — stable, shareable links */

export function driveFolderUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`
}

export function driveFileUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`
}

/** Embeddable preview (PDF, images, Docs) */
export function driveFilePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`
}

/** Thumbnail — sz param: w{width}-h{height} or w{width} */
export function driveThumbnailUrl(fileId: string, width = 220): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`
}

export function isGoogleDriveFolderId(id: string | null | undefined): boolean {
  if (!id) return false
  return !id.startsWith("mock-") && id.length > 10
}
