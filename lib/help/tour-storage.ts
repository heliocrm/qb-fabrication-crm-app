"use client"

/**
 * localStorage-backed "tour completed" tracking, scoped per user and per
 * chapter. Falls back to a shared "guest" bucket when no user id is
 * available (e.g. Supabase not configured in this environment).
 */

const STORAGE_PREFIX = "qbfab-help-tour-completed"

function storageKey(userId: string, chapterSlug: string): string {
  return `${STORAGE_PREFIX}:${userId}:${chapterSlug}`
}

export function isTourCompleted(userId: string, chapterSlug: string): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(storageKey(userId, chapterSlug)) === "1"
  } catch {
    return false
  }
}

export function markTourCompleted(userId: string, chapterSlug: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(storageKey(userId, chapterSlug), "1")
  } catch {
    // Ignore storage failures (private browsing, quota, etc.)
  }
}

export function resetTourCompleted(userId: string, chapterSlug: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(storageKey(userId, chapterSlug))
  } catch {
    // Ignore storage failures.
  }
}
