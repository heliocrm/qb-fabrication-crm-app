import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { canViewSection } from "@/lib/auth/section-access"
import { getSectionByKey, sectionKeyForPath } from "@/lib/section-registry"
import {
  getPullHomePath,
  isPullAllowedPath,
  isPullStandaloneRequest,
} from "@/lib/pull-mode"
import {
  getTravelerHomePath,
  isTravelerAllowedPath,
  isTravelerStandaloneRequest,
} from "@/lib/traveler-mode"
import type { OrganizationRole } from "@/types"

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const pullMode = isPullStandaloneRequest(request)
  const travelerMode = isTravelerStandaloneRequest(request)
  const pullHome = getPullHomePath()
  const travelerHome = getTravelerHomePath()
  const standaloneHome = travelerMode
    ? travelerHome
    : pullMode
      ? pullHome
      : null
  const pathname = request.nextUrl.pathname

  function isAllowedStandalonePath(path: string): boolean {
    if (travelerMode) return isTravelerAllowedPath(path)
    if (pullMode) return isPullAllowedPath(path)
    return true
  }

  if (!url || !anonKey) {
    if (
      standaloneHome &&
      !isAllowedStandalonePath(pathname) &&
      !pathname.includes(".")
    ) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = standaloneHome
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

  if (
    standaloneHome &&
    !isPublicAsset &&
    !isAllowedStandalonePath(pathname)
  ) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = user ? standaloneHome : "/auth/login"
    if (!user) {
      redirectUrl.searchParams.set("redirectTo", standaloneHome)
    } else {
      redirectUrl.search = ""
    }
    return NextResponse.redirect(redirectUrl)
  }

  if (!user && !isAuthRoute && !isPublicAsset) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/auth/login"
    const dest =
      standaloneHome &&
      (pathname === "/" || !isAllowedStandalonePath(pathname))
        ? standaloneHome
        : pathname
    redirectUrl.searchParams.set("redirectTo", dest)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isAuthRoute && pathname === "/auth/login") {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = standaloneHome ?? "/"
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
      redirectUrl.pathname = standaloneHome ?? "/"
      redirectUrl.search = ""
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Configurable section route guard (skip standalone pull/traveler hosts)
  if (
    user &&
    !pullMode &&
    !travelerMode &&
    !isPublicAsset &&
    !isAuthRoute
  ) {
    const sectionKey = sectionKeyForPath(pathname)
    const section = sectionKey ? getSectionByKey(sectionKey) : undefined

    if (section?.access === "configurable") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_active, organization_id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (!profile?.is_active || !profile.organization_id) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = "/"
        redirectUrl.search = ""
        return NextResponse.redirect(redirectUrl)
      }

      const role = profile.role as OrganizationRole
      const { data: accessRow } = await supabase
        .from("organization_section_access")
        .select("enabled")
        .eq("organization_id", profile.organization_id)
        .eq("section_key", sectionKey!)
        .eq("role", role)
        .maybeSingle()

      const matrix =
        accessRow != null
          ? { [sectionKey!]: { [role]: accessRow.enabled } }
          : {}

      if (!canViewSection(role, sectionKey!, matrix)) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = "/"
        redirectUrl.search = ""
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  return supabaseResponse
}
