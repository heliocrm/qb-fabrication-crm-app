"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/pull", label: "Requests", exact: true },
  { href: "/pull/new", label: "New", exact: false },
  { href: "/pull/batch", label: "Batch", exact: false },
]

export function PullNav() {
  const pathname = usePathname()

  return (
    <nav className="mx-auto max-w-lg px-4 pb-2 flex gap-1">
      {tabs.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex-1 text-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--orange)]/15 text-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
