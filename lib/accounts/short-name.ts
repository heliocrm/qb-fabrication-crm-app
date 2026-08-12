/** Uppercase alphanumeric short code (~3–8 chars) with collision suffix. */
export function deriveShortName(
  name: string,
  existing: Set<string>
): string {
  const base = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8)
  const seed = base.length >= 3 ? base : (base || "ACCT").padEnd(3, "X")
  let candidate = seed.slice(0, 8)
  let n = 2
  while (existing.has(candidate.toLowerCase())) {
    const suffix = String(n)
    candidate = `${seed.slice(0, Math.max(1, 8 - suffix.length))}${suffix}`
    n += 1
    if (n > 9999) {
      candidate = `A${Date.now().toString(36).toUpperCase()}`.slice(0, 8)
      break
    }
  }
  existing.add(candidate.toLowerCase())
  return candidate
}
