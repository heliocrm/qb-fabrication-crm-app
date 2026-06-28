import { google, type drive_v3 } from "googleapis"
import { Readable } from "stream"
import { GoogleWorkspaceService } from "../base-service"
import type { DriveFileMetadata, DriveFolderResult, DriveUploadResult } from "../types"
import {
  driveFilePreviewUrl,
  driveFileUrl,
  driveFolderUrl,
  driveThumbnailUrl,
} from "./urls"
import {
  formatDriveFileSize,
  inferDocumentType,
  isPreviewableMime,
} from "./mime"

const FILE_FIELDS =
  "id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,iconLink,createdTime,modifiedTime,parents"

const DRIVE_OPTS = {
  supportsAllDrives: true,
  includeItemsFromAllDrives: true,
} as const

export interface CreateJobFolderInput {
  jobNumber: string
  poNumber: string
  customerName: string
  parentFolderId: string
}

export class GoogleDriveService extends GoogleWorkspaceService {
  private drive: drive_v3.Drive | null = null

  private async getDrive(): Promise<drive_v3.Drive> {
    if (!this.drive) {
      this.drive = google.drive({ version: "v3", auth: this.auth })
    }
    return this.drive
  }

  /** Create a job-specific folder under the org root folder */
  async createJobFolder(input: CreateJobFolderInput): Promise<DriveFolderResult> {
    const drive = await this.getDrive()
    const name = `${input.jobNumber} · ${input.poNumber} · ${input.customerName}`

    try {
      const { data } = await drive.files.create({
        requestBody: {
          name,
          mimeType: "application/vnd.google-apps.folder",
          parents: [input.parentFolderId],
        },
        fields: "id,name,webViewLink",
        ...DRIVE_OPTS,
      })

      if (!data.id) {
        throw new Error("Drive did not return a folder ID")
      }

      const webViewLink = data.webViewLink ?? driveFolderUrl(data.id)

      await this.ensureAnyoneWithLinkCanView(data.id)

      return { id: data.id, name: data.name ?? name, webViewLink }
    } catch (err) {
      throw this.wrapError(err, "createJobFolder")
    }
  }

  /** Upload a file into the job's Drive folder */
  async uploadFile(options: {
    folderId: string
    filename: string
    mimeType: string
    buffer: Buffer
  }): Promise<DriveUploadResult> {
    const drive = await this.getDrive()

    try {
      const { data } = await drive.files.create({
        requestBody: {
          name: options.filename,
          parents: [options.folderId],
        },
        media: {
          mimeType: options.mimeType,
          body: bufferToStream(options.buffer),
        },
        fields: FILE_FIELDS,
        ...DRIVE_OPTS,
      })

      if (!data.id) throw new Error("Drive did not return a file ID")

      const meta = mapDriveFile(data, options.folderId)
      await this.ensureAnyoneWithLinkCanView(data.id)

      return {
        ...meta,
        documentType: inferDocumentType(options.filename),
      }
    } catch (err) {
      throw this.wrapError(err, "uploadFile")
    }
  }

  /** List non-folder files in a job folder */
  async listFolderFiles(folderId: string): Promise<DriveFileMetadata[]> {
    const drive = await this.getDrive()

    try {
      const files: DriveFileMetadata[] = []
      let pageToken: string | undefined

      do {
        const { data } = await drive.files.list({
          q: `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
          fields: `nextPageToken, files(${FILE_FIELDS})`,
          orderBy: "modifiedTime desc",
          pageSize: 100,
          pageToken,
          ...DRIVE_OPTS,
        })

        for (const file of data.files ?? []) {
          files.push(mapDriveFile(file, folderId))
        }
        pageToken = data.nextPageToken ?? undefined
      } while (pageToken)

      return files
    } catch (err) {
      throw this.wrapError(err, "listFolderFiles")
    }
  }

  /** Get a single file's metadata */
  async getFileMetadata(fileId: string): Promise<DriveFileMetadata> {
    const drive = await this.getDrive()

    try {
      const { data } = await drive.files.get({
        fileId,
        fields: FILE_FIELDS,
        ...DRIVE_OPTS,
      })

      return mapDriveFile(data)
    } catch (err) {
      throw this.wrapError(err, "getFileMetadata")
    }
  }

  /** Direct share / view link for shop floor access */
  getShareLinks(fileId: string, mimeType?: string) {
    return {
      webViewLink: driveFileUrl(fileId),
      previewLink: driveFilePreviewUrl(fileId),
      thumbnailLink: driveThumbnailUrl(fileId),
      downloadLink: `https://drive.google.com/uc?export=download&id=${fileId}`,
      isPreviewable: mimeType ? isPreviewableMime(mimeType) : true,
    }
  }

  /** Grant domain or link-based read access (adjust for your security policy) */
  private async ensureAnyoneWithLinkCanView(fileId: string): Promise<void> {
    const drive = await this.getDrive()

    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
        ...DRIVE_OPTS,
      })
    } catch {
      // Permission may already exist — non-fatal
    }
  }
}

function mapDriveFile(
  file: drive_v3.Schema$File,
  folderId?: string
): DriveFileMetadata {
  const sizeBytes = file.size ? Number(file.size) : null

  return {
    id: file.id!,
    name: file.name ?? "Untitled",
    mimeType: file.mimeType ?? "application/octet-stream",
    sizeBytes,
    webViewLink: file.webViewLink ?? driveFileUrl(file.id!),
    webContentLink: file.webContentLink ?? null,
    thumbnailLink: file.thumbnailLink ?? driveThumbnailUrl(file.id!),
    iconLink: file.iconLink ?? null,
    createdTime: file.createdTime ?? null,
    modifiedTime: file.modifiedTime ?? null,
    folderId: folderId ?? file.parents?.[0] ?? null,
  }
}

function bufferToStream(buffer: Buffer) {
  return Readable.from(buffer)
}

export { formatDriveFileSize, inferDocumentType, isPreviewableMime }
