import { headers } from "next/headers"

/**
 * Standalone Traveler soft-launch mode (mirrors Material Pull).
 *
 * Enable on a separate Vercel project with:
 *   NEXT_PUBLIC_APP_MODE=traveler
 *
 * Or allowlist hosts on a shared deploy:
 *   NEXT_PUBLIC_TRAVELER_APP_HOSTS=traveler.qbfab.com
 */

const TRAVELER_HOME = "/traveler"

export function getTravelerHomePath(): string {
  return TRAVELER_HOME
}

export function isTravelerModeFromEnv(): boolean {
  const mode =
    process.env.NEXT_PUBLIC_APP_MODE?.trim().toLowerCase() ||
    process.env.APP_MODE?.trim().toLowerCase()
  return mode === "traveler"
}

function normalizeHost(host: string | null | undefined): string {
  if (!host) return ""
  return host.split(":")[0].trim().toLowerCase()
}

export function getConfiguredTravelerHosts(): string[] {
  const raw =
    process.env.NEXT_PUBLIC_TRAVELER_APP_HOSTS ||
    process.env.TRAVELER_APP_HOSTS ||
    ""
  return raw
    .split(",")
    .map((h) => normalizeHost(h))
    .filter(Boolean)
}

export function isTravelerHost(host: string | null | undefined): boolean {
  const hostname = normalizeHost(host)
  if (!hostname) return false
  return getConfiguredTravelerHosts().includes(hostname)
}

export function isTravelerStandaloneRequest(request: {
  headers: { get(name: string): string | null }
}): boolean {
  if (isTravelerModeFromEnv()) return true
  return isTravelerHost(request.headers.get("host"))
}

export async function isTravelerStandalone(): Promise<boolean> {
  if (isTravelerModeFromEnv()) return true
  try {
    const h = await headers()
    return isTravelerHost(h.get("host"))
  } catch {
    return false
  }
}

export function isTravelerAllowedPath(pathname: string): boolean {
  if (pathname === TRAVELER_HOME || pathname.startsWith(`${TRAVELER_HOME}/`)) {
    return true
  }
  if (pathname.startsWith("/auth")) return true
  if (pathname === "/~offline" || pathname.startsWith("/~offline/")) return true
  return false
}
