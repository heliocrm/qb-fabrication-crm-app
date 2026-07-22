import { headers } from "next/headers"

/**
 * Standalone Material Pull soft-launch mode.
 *
 * Enable on a separate Vercel project with:
 *   NEXT_PUBLIC_APP_MODE=pull
 *
 * Or allowlist hosts on a shared deploy:
 *   NEXT_PUBLIC_PULL_APP_HOSTS=pull.qbfab.com,pull-staging.vercel.app
 */

const PULL_HOME = "/pull"

export function getPullHomePath(): string {
  return PULL_HOME
}

export function isPullModeFromEnv(): boolean {
  const mode =
    process.env.NEXT_PUBLIC_APP_MODE?.trim().toLowerCase() ||
    process.env.APP_MODE?.trim().toLowerCase()
  return mode === "pull"
}

/** Hostname only (no port), lowercased */
function normalizeHost(host: string | null | undefined): string {
  if (!host) return ""
  return host.split(":")[0].trim().toLowerCase()
}

export function getConfiguredPullHosts(): string[] {
  const raw =
    process.env.NEXT_PUBLIC_PULL_APP_HOSTS ||
    process.env.PULL_APP_HOSTS ||
    ""
  return raw
    .split(",")
    .map((h) => normalizeHost(h))
    .filter(Boolean)
}

export function isPullHost(host: string | null | undefined): boolean {
  const hostname = normalizeHost(host)
  if (!hostname) return false
  return getConfiguredPullHosts().includes(hostname)
}

/** Edge / middleware: request headers */
export function isPullStandaloneRequest(request: {
  headers: { get(name: string): string | null }
}): boolean {
  if (isPullModeFromEnv()) return true
  return isPullHost(request.headers.get("host"))
}

/** Server Components / Server Actions */
export async function isPullStandalone(): Promise<boolean> {
  if (isPullModeFromEnv()) return true
  try {
    const h = await headers()
    return isPullHost(h.get("host"))
  } catch {
    return false
  }
}

/** Paths allowed when locked to the Material Pull app */
export function isPullAllowedPath(pathname: string): boolean {
  if (pathname === PULL_HOME || pathname.startsWith(`${PULL_HOME}/`)) return true
  if (pathname.startsWith("/auth")) return true
  if (pathname === "/~offline" || pathname.startsWith("/~offline/")) return true
  return false
}
