import type { GoogleOAuth2Config } from "./types"

export function getGoogleOAuth2Config(): GoogleOAuth2Config | null {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim()
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim()
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim()
  if (!clientId || !clientSecret || !redirectUri) return null
  return {
    type: "oauth2",
    clientId,
    clientSecret,
    redirectUri,
  }
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(getGoogleOAuth2Config())
}

export function requireGoogleOAuth2Config(): GoogleOAuth2Config {
  const config = getGoogleOAuth2Config()
  if (!config) {
    throw new Error(
      "Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI."
    )
  }
  return config
}
