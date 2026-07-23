"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PULL_SHELL_WIDTH } from "@/lib/pull-layout"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/pull", label: "Requests", exact: true },
  { href: "/pull/new", label: "New", exact: false },
  { href: "/pull/batch", label: "Batch", exact: false },
]

export function PullNav() {
  const pathname = usePathname()

  return (
    <nav
      className={cn(PULL_SHELL_WIDTH, "px-4 pb-2 flex gap-1.5")}
      aria-label="Material Pull sections"
    >
      {tabs.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex-1 min-h-11 inline-flex items-center justify-center text-center rounded-lg px-3 text-sm font-medium transition-colors touch-manipulation",
              active
                ? "bg-[var(--orange)]/15 text-foreground"
                : "text-muted-foreground hover:bg-muted active:bg-muted"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
