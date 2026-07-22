import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import {
  getPullHomePath,
  isPullAllowedPath,
  isPullStandaloneRequest,
} from "@/lib/pull-mode"

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const pullMode = isPullStandaloneRequest(request)
  const pullHome = getPullHomePath()
  const pathname = request.nextUrl.pathname

  if (!url || !anonKey) {
    if (pullMode && !isPullAllowedPath(pathname) && !pathname.includes(".")) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = pullHome
      redirectUrl.search = ""
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = pathname.startsWith("/auth")
  const isPublicAsset =
    pathname.startsWith("/_next") || pathname.includes(".")

  // Soft-launch lock: only /pull, /auth, and offline shell
  if (pullMode && !isPublicAsset && !isPullAllowedPath(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = user ? pullHome : "/auth/login"
    if (!user) {
      redirectUrl.searchParams.set("redirectTo", pullHome)
    } else {
      redirectUrl.search = ""
    }
    return NextResponse.redirect(redirectUrl)
  }

  if (!user && !isAuthRoute && !isPublicAsset) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/auth/login"
    const dest =
      pullMode && (pathname === "/" || !isPullAllowedPath(pathname))
        ? pullHome
        : pathname
    redirectUrl.searchParams.set("redirectTo", dest)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isAuthRoute && pathname === "/auth/login") {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = pullMode ? pullHome : "/"
    redirectUrl.search = ""
    return NextResponse.redirect(redirectUrl)
  }

  if (user && pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!profile?.is_active || profile.role !== "admin") {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = pullMode ? pullHome : "/"
      redirectUrl.search = ""
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}
