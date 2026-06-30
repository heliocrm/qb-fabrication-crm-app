import { Resend } from "resend"

/** Verified sending domain in Resend (qbfab.com) */
export const DEFAULT_FROM_EMAIL = "QB Fabrication <invites@qbfab.com>"

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

export function getResendFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM_EMAIL
}

let client: Resend | null = null

export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error(
      "Missing RESEND_API_KEY. Required for sending invite emails."
    )
  }
  if (!client) {
    client = new Resend(apiKey)
  }
  return client
}
