import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/types/database"
import {
  getPullHomePath,
  isPullAllowedPath,
  isPullStandaloneRequest,
} from "@/lib/pull-mode"
import { getSupabaseEnv } from "@/lib/supabase/env"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const pullMode = isPullStandaloneRequest(request)
  const pullHome = getPullHomePath()
  let redirectTo = searchParams.get("redirectTo") ?? (pullMode ? pullHome : "/")

  if (pullMode) {
    const path = redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`
    if (!isPullAllowedPath(path.split("?")[0] ?? path)) {
      redirectTo = pullHome
    }
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent("Authentication failed. Please try again.")}`
    )
  }

  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseEnv()
  const destination = `${origin}${redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`}`

  let response = NextResponse.redirect(destination)

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error.message)}`
    )
  }

  return response
}
