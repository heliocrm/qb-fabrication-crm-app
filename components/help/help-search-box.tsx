"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { HELP_ICONS } from "@/lib/help/icons"
import { searchHelpChapters } from "@/lib/help/search"
import { cn } from "@/lib/utils"

export function HelpSearchBox() {
  const [query, setQuery] = useState("")
  const results = useMemo(() => searchHelpChapters(query), [query])
  const trimmed = query.trim()

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chapters and steps — e.g. &ldquo;floor PIN&rdquo; or &ldquo;win an opportunity&rdquo;"
          className="h-11 pl-9"
          aria-label="Search the Help Center"
        />
      </div>

      {trimmed !== "" && (
        <div
          className={cn(
            "absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg",
            results.length === 0 && "p-4 text-sm text-muted-foreground"
          )}
        >
          {results.length === 0 ? (
            <p>No chapters match &ldquo;{trimmed}&rdquo;.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.slice(0, 8).map((result) => {
                const Icon = HELP_ICONS[result.chapter.iconName]
                return (
                  <li key={result.chapter.slug}>
                    <Link
                      href={`/help/${result.chapter.slug}`}
                      className="flex items-start gap-3 px-3 py-2.5 hover:bg-muted"
                    >
                      <Icon className="mt-0.5 size-4 shrink-0 text-[var(--orange)]" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{result.chapter.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{result.snippet}</p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
