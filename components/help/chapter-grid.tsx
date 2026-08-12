"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { helpChapters } from "@/lib/help/content"
import { HELP_ICONS } from "@/lib/help/icons"
import { HELP_NAV_GROUP_LABELS, type HelpNavGroup } from "@/lib/help/types"
import { chapterMatchesRole } from "@/lib/help/roles"
import { useHelpRoleFilter } from "@/lib/help/use-help-role-filter"
import { cn } from "@/lib/utils"

const GROUP_ORDER: HelpNavGroup[] = ["user-guide", "admin-guide", "floor-cheat-sheets"]

export function ChapterGrid() {
  const { role } = useHelpRoleFilter()

  return (
    <div className="space-y-8">
      {GROUP_ORDER.map((group) => {
        const chapters = helpChapters.filter((c) => c.navGroup === group)
        if (chapters.length === 0) return null

        return (
          <div key={group}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {HELP_NAV_GROUP_LABELS[group]}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {chapters.map((chapter) => {
                const Icon = HELP_ICONS[chapter.iconName]
                const matches = chapterMatchesRole(chapter, role)
                return (
                  <Link key={chapter.slug} href={`/help/${chapter.slug}${role ? `?role=${role}` : ""}`}>
                    <Card
                      className={cn(
                        "h-full ring-1 transition-colors hover:ring-[var(--orange)]/50",
                        matches ? "ring-foreground/10" : "opacity-60 ring-foreground/10"
                      )}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--orange-muted)] text-[var(--orange)]">
                            <Icon className="size-4" aria-hidden="true" />
                          </div>
                          {chapter.adminOnly && (
                            <Badge variant="secondary" className="text-[10px]">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="pt-1">{chapter.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs leading-relaxed text-muted-foreground">{chapter.summary}</p>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
