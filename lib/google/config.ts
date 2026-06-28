import type { GoogleServiceAccountConfig, GoogleWorkspaceConfig } from "./types"

/**
 * Environment-based Google Workspace configuration.
 *
 * Service account (recommended for server-side Drive ops):
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY  (use \n for newlines in .env)
 *   GOOGLE_DRIVE_JOBS_ROOT_FOLDER_ID
 *   GOOGLE_WORKSPACE_IMPERSONATE_EMAIL  (optional — domain-wide delegation)
 *
 * OAuth2 (future — user-delegated access for personal Drive):
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GOOGLE_OAUTH_REDIRECT_URI
 *
 * Or pass full JSON (Vercel-friendly):
 *   GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
 */
export function isGoogleConfigured(): boolean {
  return Boolean(getServiceAccountConfig())
}

export function getGoogleWorkspaceConfig(): GoogleWorkspaceConfig | null {
  const serviceAccount = getServiceAccountConfig()
  if (!serviceAccount) return null

  return {
    authMode: "service_account",
    serviceAccount,
    driveJobsRootFolderId: process.env.GOOGLE_DRIVE_JOBS_ROOT_FOLDER_ID,
    workspaceDomain: process.env.GOOGLE_WORKSPACE_DOMAIN,
  }
}

export function requireGoogleConfig(): GoogleWorkspaceConfig {
  const config = getGoogleWorkspaceConfig()
  if (!config) {
    throw new Error(
      "Google Workspace is not configured. Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY to .env.local."
    )
  }
  return config
}

function getServiceAccountConfig(): GoogleServiceAccountConfig | null {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (json) {
    try {
      const parsed = JSON.parse(json) as {
        client_email?: string
        private_key?: string
      }
      if (parsed.client_email && parsed.private_key) {
        return {
          type: "service_account",
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key,
          impersonateEmail: process.env.GOOGLE_WORKSPACE_IMPERSONATE_EMAIL,
        }
      }
    } catch {
      return null
    }
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

  if (!clientEmail || !privateKeyRaw) return null

  return {
    type: "service_account",
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
    impersonateEmail: process.env.GOOGLE_WORKSPACE_IMPERSONATE_EMAIL,
  }
}

export function isDriveConfigured(): boolean {
  const config = getGoogleWorkspaceConfig()
  return Boolean(config?.serviceAccount && config.driveJobsRootFolderId)
}

export function requireDriveConfig(): GoogleWorkspaceConfig & {
  driveJobsRootFolderId: string
} {
  const config = requireGoogleConfig()
  if (!config.driveJobsRootFolderId) {
    throw new Error(
      "GOOGLE_DRIVE_JOBS_ROOT_FOLDER_ID is required for Drive integration."
    )
  }
  return { ...config, driveJobsRootFolderId: config.driveJobsRootFolderId }
}
