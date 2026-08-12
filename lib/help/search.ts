import { helpChapters } from "@/lib/help/content"
import type { HelpChapter } from "@/lib/help/types"

export interface HelpSearchResult {
  chapter: HelpChapter
  matchedIn: "title" | "summary" | "step" | "heading"
  snippet: string
}

/** Simple client-side substring search across chapter titles, summaries,
 *  section headings, and step text. Good enough for a help center of this size. */
export function searchHelpChapters(query: string): HelpSearchResult[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const results: HelpSearchResult[] = []

  for (const chapter of helpChapters) {
    if (chapter.title.toLowerCase().includes(q)) {
      results.push({ chapter, matchedIn: "title", snippet: chapter.title })
      continue
    }
    if (chapter.summary.toLowerCase().includes(q)) {
      results.push({ chapter, matchedIn: "summary", snippet: chapter.summary })
      continue
    }

    let matched = false
    for (const sub of chapter.subsections) {
      if (sub.heading.toLowerCase().includes(q)) {
        results.push({ chapter, matchedIn: "heading", snippet: sub.heading })
        matched = true
        break
      }
      if (sub.body.kind === "steps") {
        const step = sub.body.steps.find((s) => s.text.toLowerCase().includes(q))
        if (step) {
          results.push({ chapter, matchedIn: "step", snippet: step.text })
          matched = true
          break
        }
      }
      if (sub.body.kind === "text" && sub.body.body.toLowerCase().includes(q)) {
        results.push({ chapter, matchedIn: "step", snippet: sub.body.body })
        matched = true
        break
      }
    }
    if (matched) continue
  }

  return results
}
