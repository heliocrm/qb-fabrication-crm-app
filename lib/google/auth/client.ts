import type { Auth } from "googleapis"
import { createServiceAccountAuth } from "./service-account"
import type { GoogleWorkspaceConfig } from "../types"
import { GOOGLE_SCOPES } from "../types"

/**
 * Unified auth entry point for all Google Workspace services.
 * CalendarService and GmailService will use the same factory later.
 */
export async function createGoogleAuth(
  config: GoogleWorkspaceConfig,
  scopes: string[] = [...GOOGLE_SCOPES.driveFull]
) {
  if (config.authMode === "service_account" && config.serviceAccount) {
    return createServiceAccountAuth(config.serviceAccount, scopes)
  }

  // Future: load stored OAuth2 refresh token for the current user
  throw new Error(
    "OAuth2 user auth is not implemented yet. Use service account credentials."
  )
}

export { GOOGLE_SCOPES } from "../types"
