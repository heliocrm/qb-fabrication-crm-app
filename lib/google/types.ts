/**
 * Google Workspace integration — shared types.
 * Extend this file when adding Calendar, Gmail, Docs, etc.
 */

export type GoogleAuthMode = "service_account" | "oauth2"

export interface GoogleServiceAccountConfig {
  type: "service_account"
  clientEmail: string
  privateKey: string
  /** Domain-wide delegation: impersonate this user (e.g. drive@qbfab.com) */
  impersonateEmail?: string
}

export interface GoogleOAuth2Config {
  type: "oauth2"
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface GoogleWorkspaceConfig {
  authMode: GoogleAuthMode
  serviceAccount?: GoogleServiceAccountConfig
  oauth2?: GoogleOAuth2Config
  /** Parent Drive folder for all job folders */
  driveJobsRootFolderId?: string
  workspaceDomain?: string
}

/** Normalized Drive file metadata for UI + Supabase sync */
export interface DriveFileMetadata {
  id: string
  name: string
  mimeType: string
  sizeBytes?: number | null
  webViewLink?: string | null
  webContentLink?: string | null
  thumbnailLink?: string | null
  iconLink?: string | null
  createdTime?: string | null
  modifiedTime?: string | null
  folderId?: string | null
}

export interface DriveFolderResult {
  id: string
  name: string
  webViewLink: string
}

export interface DriveUploadResult extends DriveFileMetadata {
  documentType: string
}

export class GoogleServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message)
    this.name = "GoogleServiceError"
  }
}

/** Scopes per Google product — add Calendar/Gmail here later */
export const GOOGLE_SCOPES = {
  drive: [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.readonly",
  ],
  /** Full drive access for folder management + sharing (service account) */
  driveFull: ["https://www.googleapis.com/auth/drive"],
  calendar: ["https://www.googleapis.com/auth/calendar"],
  gmail: ["https://www.googleapis.com/auth/gmail.send"],
} as const
