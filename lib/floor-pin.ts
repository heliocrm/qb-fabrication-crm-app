import { randomBytes, scryptSync, timingSafeEqual } from "crypto"

const PIN_RE = /^\d{4,8}$/

export function isValidFloorPin(pin: string): boolean {
  return PIN_RE.test(pin.trim())
}

/** Returns `saltHex:hashHex` for storage in profiles.floor_pin_hash. */
export function hashFloorPin(pin: string): string {
  const normalized = pin.trim()
  if (!isValidFloorPin(normalized)) {
    throw new Error("PIN must be 4–8 digits.")
  }
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(normalized, salt, 32).toString("hex")
  return `${salt}:${hash}`
}

export function verifyFloorPin(pin: string, stored: string | null | undefined): boolean {
  if (!stored) return false
  const normalized = pin.trim()
  if (!isValidFloorPin(normalized)) return false
  const [salt, hashHex] = stored.split(":")
  if (!salt || !hashHex) return false
  try {
    const next = scryptSync(normalized, salt, 32)
    const prev = Buffer.from(hashHex, "hex")
    if (next.length !== prev.length) return false
    return timingSafeEqual(next, prev)
  } catch {
    return false
  }
}
