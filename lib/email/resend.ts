import { Resend } from "resend"

/** Verified sending domain in Resend (updates.qbfab.com) */
export const DEFAULT_FROM_EMAIL = "QB Fabrication <invites@updates.qbfab.com>"

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

export function getResendFromAddress(): string {
  const custom = process.env.RESEND_FROM_EMAIL
  if (!custom) return DEFAULT_FROM_EMAIL
  if (custom.includes("<")) return custom
  return `QB Fabrication <${custom}>`
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
