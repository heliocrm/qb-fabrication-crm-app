/**
 * Maps text found in the "Bill To" section of a work order
 * to the clean customer name printed on the traveler.
 *
 * Match: if KEY appears anywhere in the Bill To text (case-insensitive).
 */
export const CUSTOMER_NAME_MAP: Record<string, string> = {
  BPA: "Bonneville Power Administration",
  WESCO: "Wesco",
  IRBY: "Irby",
  "BORDER STATES": "Border States",
  POTELCO: "Potelco",
  NORTHWESTERN: "NorthWestern Energy",
  BURNS: "Burns McDonnell",
  "PORTLAND GENERAL": "Portland General Electric",
  "MOUNTAIN ENGINEERING": "Mountain Engineering",
}

export function resolveCustomerName(billToRaw: string): string {
  const raw = billToRaw.trim()
  if (!raw) return "N/A"
  const upper = raw.toUpperCase()
  for (const [key, name] of Object.entries(CUSTOMER_NAME_MAP)) {
    if (upper.includes(key)) return name
  }
  return raw
}
