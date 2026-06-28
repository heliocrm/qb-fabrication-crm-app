import { google, type Auth } from "googleapis"
import type { GoogleServiceAccountConfig } from "../types"
import { GoogleServiceError } from "../types"

/**
 * Service account authentication for server-side Google API calls.
 *
 * Setup (Google Cloud Console):
 * 1. Create a service account + download JSON key
 * 2. Enable Google Drive API
 * 3. For Shared Drive / user-owned folders: enable domain-wide delegation
 *    and authorize the client ID in Google Workspace Admin → Security → API controls
 * 4. Set GOOGLE_WORKSPACE_IMPERSONATE_EMAIL to a user with access to the root folder
 */
export async function createServiceAccountAuth(
  config: GoogleServiceAccountConfig,
  scopes: string[]
) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.clientEmail,
        private_key: config.privateKey,
      },
      scopes,
      ...(config.impersonateEmail
        ? { clientOptions: { subject: config.impersonateEmail } }
        : {}),
    })

    return auth
  } catch (err) {
    throw new GoogleServiceError(
      err instanceof Error ? err.message : "Failed to create service account auth",
      "AUTH_ERROR"
    )
  }
}

/**
 * OAuth2 client factory — for future user-delegated flows (Calendar invites, Gmail send).
 *
 * Flow (not wired yet):
 * 1. GET /api/google/oauth/start → redirect to Google consent
 * 2. GET /api/google/oauth/callback → exchange code, store refresh token per user in Supabase
 * 3. Use createOAuth2Client(refreshToken) for user-scoped API calls
 */
export function createOAuth2Client(options: {
  clientId: string
  clientSecret: string
  redirectUri: string
}) {
  return new google.auth.OAuth2(
    options.clientId,
    options.clientSecret,
    options.redirectUri
  )
}

export async function getAuthenticatedClient(auth: Awaited<ReturnType<typeof createServiceAccountAuth>>) {
  const client = (await auth.getClient()) as unknown as Auth.OAuth2Client
  return client
}
