"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Briefcase,
  Building2,
  Loader2,
  Search,
  TrendingUp,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { globalSearchAction } from "@/lib/actions/search"
import { toast } from "@/lib/toast"
import type { GlobalSearchResult, GlobalSearchResultType } from "@/lib/search-types"
import { cn } from "@/lib/utils"

const DEBOUNCE_MS = 300

const typeConfig: Record<
  GlobalSearchResultType,
  { label: string; groupLabel: string; icon: typeof Briefcase; className: string }
> = {
  job: {
    label: "Job",
    groupLabel: "Jobs",
    icon: Briefcase,
    className: "text-blue-600 dark:text-blue-400",
  },
  opportunity: {
    label: "Opportunity",
    groupLabel: "Opportunities",
    icon: TrendingUp,
    className: "text-[var(--orange)]",
  },
  account: {
    label: "Customer",
    groupLabel: "Customers",
    icon: Building2,
    className: "text-muted-foreground",
  },
}

const groupOrder: GlobalSearchResultType[] = ["job", "opportunity", "account"]

function groupResults(results: GlobalSearchResult[]) {
  const groups = new Map<GlobalSearchResultType, GlobalSearchResult[]>()
  for (const type of groupOrder) {
    groups.set(type, [])
  }
  for (const result of results) {
    groups.get(result.type)?.push(result)
  }
  return groupOrder
    .map((type) => ({ type, items: groups.get(type) ?? [] }))
    .filter((g) => g.items.length > 0)
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [results, setResults] = useState<GlobalSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const grouped = useMemo(() => groupResults(results), [results])

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false)
      setQuery("")
      router.push(href)
    },
    [router]
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    if (!open) {
      setQuery("")
      setDebouncedQuery("")
      setResults([])
      setError(null)
      setLoading(false)
    }
  }, [open])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query)
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const trimmed = debouncedQuery.trim()
    if (!trimmed) {
      setResults([])
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    globalSearchAction(trimmed).then((response) => {
      if (cancelled) return
      setLoading(false)
      if (response.error) {
        setError(response.error)
        setResults([])
        toast.error("Search failed", response.error)
        return
      }
      setResults(response.data ?? [])
    })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative hidden md:flex flex-1 max-w-md items-center"
        aria-label="Open search (⌘K)"
      >
        <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
        <span className="flex h-9 w-full items-center rounded-lg border border-input bg-background pl-9 pr-16 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-muted/40">
          Search jobs, POs, customers…
        </span>
        <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden size-9 shrink-0"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <Search className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[min(85dvh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>Global search</DialogTitle>
            <DialogDescription>Search jobs, opportunities, and customers</DialogDescription>
          </DialogHeader>

          <div className="flex items-center border-b px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Input
              autoFocus
              placeholder="Search jobs, PO numbers, customers…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search query"
              className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            {loading && (
              <Loader2
                className="size-4 shrink-0 animate-spin text-muted-foreground"
                aria-label="Searching"
              />
            )}
          </div>

          <ScrollArea className="min-h-0 flex-1 max-h-[min(60dvh,320px)]">
            {query.trim() === "" ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Type to search across jobs, opportunities, and customers.
              </div>
            ) : loading && results.length === 0 ? (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Searching…
              </div>
            ) : error && results.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-destructive">
                {error}
              </div>
            ) : grouped.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              <div className="p-2">
                {grouped.map(({ type, items }) => {
                  const config = typeConfig[type]
                  return (
                    <div key={type} className="mb-1 last:mb-0">
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {config.groupLabel}
                      </p>
                      <ul>
                        {items.map((result) => {
                          const Icon = config.icon
                          return (
                            <li key={`${result.type}-${result.id}`}>
                              <button
                                type="button"
                                onClick={() => handleSelect(result.href)}
                                className="flex min-h-11 w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted/60 active:bg-muted/80"
                              >
                                <div
                                  className={cn(
                                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted",
                                    config.className
                                  )}
                                >
                                  <Icon className="size-4" aria-hidden="true" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate text-sm font-medium">{result.title}</p>
                                    {result.badge && (
                                      <Badge
                                        variant="secondary"
                                        className="shrink-0 text-[10px] px-1.5 py-0"
                                      >
                                        {result.badge}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {result.subtitle}
                                  </p>
                                </div>
                                <span className="hidden shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:inline">
                                  {config.label}
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          <div className="hidden border-t px-4 py-2 text-[10px] text-muted-foreground sm:block">
            <span className="font-medium">Tip:</span> Press{" "}
            <kbd className="rounded border bg-muted px-1 font-mono">⌘K</kbd> anywhere to search
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
