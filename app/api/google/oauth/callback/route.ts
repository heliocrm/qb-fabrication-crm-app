import { NextResponse } from "next/server"
import { getSessionContext } from "@/lib/auth/session"
import { exchangeCodeForTokens } from "@/lib/google/auth/oauth2"
import { verifyOAuthState } from "@/lib/google/oauth-state"
import { upsertGoogleOAuthToken } from "@/lib/supabase/services/google-oauth-tokens"

function settingsRedirect(
  request: Request,
  params: Record<string, string>
): NextResponse {
  const url = new URL("/settings", request.url)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  return NextResponse.redirect(url)
}

export async function GET(request: Request) {
  const ctx = await getSessionContext()
  if (!ctx) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const { searchParams } = new URL(request.url)
  const error = searchParams.get("error")
  if (error) {
    return settingsRedirect(request, {
      google: "error",
      message: searchParams.get("error_description") || error,
    })
  }

  const code = searchParams.get("code")
  const state = searchParams.get("state")
  if (!code || !state) {
    return settingsRedirect(request, {
      google: "error",
      message: "Missing OAuth code or state",
    })
  }

  const verified = verifyOAuthState(state)
  if (!verified || verified.profileId !== ctx.profileId) {
    return settingsRedirect(request, {
      google: "error",
      message: "Invalid or expired OAuth state",
    })
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    await upsertGoogleOAuthToken({
      profileId: ctx.profileId,
      email: tokens.email,
      refreshToken: tokens.refreshToken,
      scopes: tokens.scopes,
      tokenExpiry: tokens.expiryDate,
    })
    return settingsRedirect(request, { google: "connected" })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to complete Google OAuth"
    return settingsRedirect(request, {
      google: "error",
      message,
    })
  }
}
