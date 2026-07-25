import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
} from "@/lib/supabase/schema"
import { sealRefreshToken, unsealRefreshToken } from "@/lib/google/crypto/token-seal"

export interface GoogleOAuthConnection {
  profileId: string
  email: string
  scopes: string[]
  lastGmailSyncAt: string | null
  lastCalendarSyncAt: string | null
  connectedAt: string
}

type TokenRow = {
  profile_id: string
  email: string
  encrypted_refresh_token: string
  scopes: string[] | null
  last_gmail_sync_at: string | null
  last_calendar_sync_at: string | null
  created_at: string
}

export async function getGoogleOAuthConnection(
  profileId: string
): Promise<GoogleOAuthConnection | null> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.google_oauth_tokens)
    .select(
      "profile_id, email, encrypted_refresh_token, scopes, last_gmail_sync_at, last_calendar_sync_at, created_at"
    )
    .eq("profile_id", profileId)
    .maybeSingle()

  if (error) throwOnError({ data: null, error })
  if (!data) return null

  const row = data as TokenRow
  return {
    profileId: row.profile_id,
    email: row.email,
    scopes: row.scopes ?? [],
    lastGmailSyncAt: row.last_gmail_sync_at,
    lastCalendarSyncAt: row.last_calendar_sync_at,
    connectedAt: row.created_at,
  }
}

export async function getDecryptedRefreshToken(
  profileId: string
): Promise<string | null> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.google_oauth_tokens)
    .select("encrypted_refresh_token")
    .eq("profile_id", profileId)
    .maybeSingle()

  if (error) throwOnError({ data: null, error })
  if (!data?.encrypted_refresh_token) return null
  return unsealRefreshToken(data.encrypted_refresh_token as string)
}

export async function upsertGoogleOAuthToken(input: {
  profileId: string
  email: string
  refreshToken: string
  scopes: string[]
  tokenExpiry?: number | null
}): Promise<void> {
  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)

  const payload = {
    profile_id: input.profileId,
    organization_id: organizationId,
    email: input.email,
    encrypted_refresh_token: sealRefreshToken(input.refreshToken),
    scopes: input.scopes,
    token_expiry: input.tokenExpiry
      ? new Date(input.tokenExpiry).toISOString()
      : null,
  }

  const { error } = await supabase
    .from(Tables.google_oauth_tokens)
    .upsert(payload, { onConflict: "profile_id" })

  if (error) throwOnError({ data: null, error })
}

export async function deleteGoogleOAuthToken(profileId: string): Promise<void> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const { error } = await supabase
    .from(Tables.google_oauth_tokens)
    .delete()
    .eq("profile_id", profileId)

  if (error) throwOnError({ data: null, error })
}

export async function touchGmailSyncAt(profileId: string): Promise<void> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)
  const { error } = await supabase
    .from(Tables.google_oauth_tokens)
    .update({ last_gmail_sync_at: new Date().toISOString() })
    .eq("profile_id", profileId)
  if (error) throwOnError({ data: null, error })
}

export async function touchCalendarSyncAt(profileId: string): Promise<void> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)
  const { error } = await supabase
    .from(Tables.google_oauth_tokens)
    .update({ last_calendar_sync_at: new Date().toISOString() })
    .eq("profile_id", profileId)
  if (error) throwOnError({ data: null, error })
}
