import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto"

const ALGO = "aes-256-gcm"

function getKey(): Buffer {
  const raw = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY?.trim()
  if (!raw) {
    throw new Error(
      "GOOGLE_TOKEN_ENCRYPTION_KEY is required to store Google OAuth refresh tokens"
    )
  }
  // Accept 64-char hex or any passphrase (hashed to 32 bytes)
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex")
  }
  return createHash("sha256").update(raw, "utf8").digest()
}

/** Seal a refresh token for DB storage (iv:tag:ciphertext, base64url). */
export function sealRefreshToken(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString("base64url")
}

export function unsealRefreshToken(sealed: string): string {
  const key = getKey()
  const buf = Buffer.from(sealed, "base64url")
  if (buf.length < 12 + 16) {
    throw new Error("Invalid sealed token payload")
  }
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const data = buf.subarray(28)
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8"
  )
}

export function isTokenEncryptionConfigured(): boolean {
  return Boolean(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY?.trim())
}
