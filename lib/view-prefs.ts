/** Client-side view preferences shared by list pages and Settings */

export const JOBS_VIEW_KEY = "qb.jobs.view"
export const OPPORTUNITIES_VIEW_KEY = "qb.opportunities.view"

export type JobsView = "table" | "kanban"
export type OpportunitiesView = "kanban" | "list"

export function readViewPref<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T
): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw && (allowed as readonly string[]).includes(raw)) {
      return raw as T
    }
  } catch {
    /* ignore */
  }
  return fallback
}

export function writeViewPref(key: string, value: string) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}
