import type { HelpChapter, HelpRole } from "@/lib/help/types"

/** Heuristic match of a role filter chip against free-text "who can" copy
 *  (e.g. "admin, manager" or "All roles"). Good enough for callout styling —
 *  not an access-control check. */
export function roleMatchesText(role: HelpRole, text: string | undefined): boolean {
  if (!text) return true
  const t = text.toLowerCase()
  if (t.includes("all roles") || t.includes("anyone") || t.includes("all users")) return true
  return t.includes(role)
}

export function chapterMatchesRole(chapter: HelpChapter, role: HelpRole | null): boolean {
  if (!role) return true
  return chapter.recommendedFor.includes(role)
}
