import { createGoogleAuth } from "../auth/client"
import { requireDriveConfig, requireGoogleConfig } from "../config"
import { GoogleDriveService } from "./service"
import { GOOGLE_SCOPES } from "../types"

export async function createDriveService(): Promise<GoogleDriveService> {
  const config = requireDriveConfig()
  const auth = await createGoogleAuth(config, [...GOOGLE_SCOPES.driveFull])
  return new GoogleDriveService(auth)
}

export async function createDriveServiceIfConfigured(): Promise<GoogleDriveService | null> {
  try {
    const config = requireGoogleConfig()
    if (!config.driveJobsRootFolderId) return null
    const auth = await createGoogleAuth(config, [...GOOGLE_SCOPES.driveFull])
    return new GoogleDriveService(auth)
  } catch {
    return null
  }
}

export { GoogleDriveService } from "./service"
export * from "./urls"
export * from "./mime"
