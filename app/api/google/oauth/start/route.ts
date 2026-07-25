import { NextResponse } from "next/server"
import { getSessionContext } from "@/lib/auth/session"
import { isGoogleOAuthConfigured } from "@/lib/google/oauth-config"
import { isTokenEncryptionConfigured } from "@/lib/google/crypto/token-seal"
import { buildGoogleConsentUrl } from "@/lib/google/auth/oauth2"
import { signOAuthState } from "@/lib/google/oauth-state"

export async function GET(request: Request) {
  const ctx = await getSessionContext()
  if (!ctx) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (!isGoogleOAuthConfigured() || !isTokenEncryptionConfigured()) {
    return NextResponse.redirect(
      new URL(
        "/settings?google=error&message=" +
          encodeURIComponent(
            "Google OAuth is not configured. Set client ID/secret, redirect URI, and GOOGLE_TOKEN_ENCRYPTION_KEY."
          ),
        request.url
      )
    )
  }

  const state = signOAuthState(ctx.profileId)
  const url = buildGoogleConsentUrl(state)
  return NextResponse.redirect(url)
}
