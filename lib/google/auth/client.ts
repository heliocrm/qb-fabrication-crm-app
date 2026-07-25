import { createServiceAccountAuth } from "./service-account"
import { createUserOAuth2Client } from "./oauth2"
import type { GoogleWorkspaceConfig } from "../types"
import { GOOGLE_SCOPES } from "../types"
import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
} from "@/lib/supabase/schema"

/**
 * Unified auth entry point for Google Workspace services.
 * Drive uses service account; Gmail/Calendar CRM sync uses per-user OAuth2.
 */
export async function createGoogleAuth(
  config: GoogleWorkspaceConfig,
  scopes: string[] = [...GOOGLE_SCOPES.driveFull]
) {
  if (config.authMode === "service_account" && config.serviceAccount) {
    return createServiceAccountAuth(config.serviceAccount, scopes)
  }

  throw new Error(
    "Google auth is not configured. Use service account credentials or connect Google in Settings."
  )
}

/** Per-user OAuth2 client from encrypted refresh token in google_oauth_tokens */
export async function createUserOAuthClientFromProfile(profileId: string) {
  const supabase = await createClient()
  await requireOrganizationId(supabase)
  const { data, error } = await supabase
    .from(Tables.google_oauth_tokens)
    .select("encrypted_refresh_token")
    .eq("profile_id", profileId)
    .maybeSingle()
  if (error) throwOnError({ data: null, error })
  if (!data?.encrypted_refresh_token) {
    throw new Error(
      "Google Workspace is not connected. Connect Gmail in Settings → Integrations."
    )
  }
  return createUserOAuth2Client(data.encrypted_refresh_token as string)
}

export { GOOGLE_SCOPES } from "../types"
export {
  createOAuth2Client,
  buildGoogleConsentUrl,
  exchangeCodeForTokens,
  createUserOAuth2Client,
} from "./oauth2"
