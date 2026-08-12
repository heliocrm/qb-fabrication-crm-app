"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home } from "lucide-react"
import { helpChapters } from "@/lib/help/content"
import { HELP_ICONS } from "@/lib/help/icons"
import {
  HELP_NAV_GROUP_LABELS,
  type HelpNavGroup,
} from "@/lib/help/types"
import { useHelpRoleFilter } from "@/lib/help/use-help-role-filter"
import { chapterMatchesRole } from "@/lib/help/roles"
import { cn } from "@/lib/utils"

const GROUP_ORDER: HelpNavGroup[] = ["user-guide", "admin-guide", "floor-cheat-sheets"]

export function HelpChapterNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { role } = useHelpRoleFilter()

  return (
    <nav className="space-y-5" aria-label="Help chapters">
      <Link
        href="/help"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
          pathname === "/help"
            ? "bg-[var(--orange-muted)] text-[var(--orange)]"
            : "text-foreground hover:bg-muted"
        )}
      >
        <Home className="size-4" aria-hidden="true" />
        Help home
      </Link>

      {GROUP_ORDER.map((group) => {
        const chapters = helpChapters.filter((c) => c.navGroup === group)
        if (chapters.length === 0) return null

        return (
          <div key={group}>
            <p className="px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {HELP_NAV_GROUP_LABELS[group]}
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {chapters.map((chapter) => {
                const Icon = HELP_ICONS[chapter.iconName]
                const isActive = pathname === `/help/${chapter.slug}`
                const matchesRole = chapterMatchesRole(chapter, role)
                return (
                  <li key={chapter.slug}>
                    <Link
                      href={`/help/${chapter.slug}${role ? `?role=${role}` : ""}`}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-[var(--orange-muted)] font-medium text-[var(--orange)]"
                          : matchesRole
                            ? "text-foreground hover:bg-muted"
                            : "text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground"
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{chapter.title}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
