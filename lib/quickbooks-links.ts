/**
 * Thin QuickBooks Online deep-link helpers.
 * Financial truth stays in QB — we only store URLs / display notes.
 */

const QBO_CUSTOMER_BASE =
  "https://app.qbo.intuit.com/app/customerdetail?nameId="

/** Build a QBO customer URL from a nameId if the user only has an ID */
export function buildQboCustomerUrl(customerId: string): string {
  const id = customerId.trim()
  if (!id) return ""
  if (/^https?:\/\//i.test(id)) return id
  return `${QBO_CUSTOMER_BASE}${encodeURIComponent(id)}`
}

export function resolveQbCustomerUrl(input: {
  qbCustomerUrl?: string | null
  qbCustomerId?: string | null
}): string | null {
  const url = input.qbCustomerUrl?.trim()
  if (url) return url
  const id = input.qbCustomerId?.trim()
  if (id) return buildQboCustomerUrl(id)
  return null
}
