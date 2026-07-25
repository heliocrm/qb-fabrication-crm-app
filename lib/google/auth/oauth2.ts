import { google } from "googleapis"
import { requireGoogleOAuth2Config } from "../oauth-config"
import { GOOGLE_SCOPES } from "../types"
import { unsealRefreshToken } from "../crypto/token-seal"

export function createOAuth2Client() {
  const config = requireGoogleOAuth2Config()
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  )
}

export function buildGoogleConsentUrl(state: string): string {
  const client = createOAuth2Client()
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [...GOOGLE_SCOPES.crmSync],
    state,
    include_granted_scopes: true,
  })
}

export async function exchangeCodeForTokens(code: string) {
  const client = createOAuth2Client()
  const { tokens } = await client.getToken(code)
  if (!tokens.refresh_token) {
    throw new Error(
      "Google did not return a refresh token. Disconnect the app in Google Account permissions and try again with consent."
    )
  }
  client.setCredentials(tokens)

  const oauth2 = google.oauth2({ version: "v2", auth: client })
  const me = await oauth2.userinfo.get()
  const email = me.data.email
  if (!email) {
    throw new Error("Could not read Google account email")
  }

  return {
    refreshToken: tokens.refresh_token,
    expiryDate: tokens.expiry_date ?? null,
    scopes: (tokens.scope ?? "").split(" ").filter(Boolean),
    email,
  }
}

/** OAuth2 client with sealed refresh token loaded for API calls */
export function createUserOAuth2Client(encryptedRefreshToken: string) {
  const client = createOAuth2Client()
  client.setCredentials({
    refresh_token: unsealRefreshToken(encryptedRefreshToken),
  })
  return client
}
