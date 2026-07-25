import { createHmac, timingSafeEqual } from "crypto"

function secret(): string {
  return (
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY?.trim() ||
    process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() ||
    "qb-oauth-dev-state"
  )
}

/** Signed state: profileId.timestamp.sig */
export function signOAuthState(profileId: string): string {
  const ts = Date.now().toString(36)
  const payload = `${profileId}.${ts}`
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url")
  return `${payload}.${sig}`
}

export function verifyOAuthState(
  state: string,
  maxAgeMs = 15 * 60 * 1000
): { profileId: string } | null {
  const parts = state.split(".")
  if (parts.length !== 3) return null
  const [profileId, ts, sig] = parts
  if (!profileId || !ts || !sig) return null

  const payload = `${profileId}.${ts}`
  const expected = createHmac("sha256", secret())
    .update(payload)
    .digest("base64url")

  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  const age = Date.now() - parseInt(ts, 36)
  if (!Number.isFinite(age) || age < 0 || age > maxAgeMs) return null

  return { profileId }
}
