"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { helpChapters } from "@/lib/help/content"
import { HELP_ICONS } from "@/lib/help/icons"
import { HELP_ROLES, type HelpRole } from "@/lib/help/types"
import { useHelpRoleFilter } from "@/lib/help/use-help-role-filter"
import { cn } from "@/lib/utils"

const ROLE_BLURBS: Record<HelpRole, string> = {
  admin: "Invite users, manage roles, and configure section access.",
  manager: "Approve pulls, manage jobs, and run production.",
  member: "Work opportunities, jobs, and customer accounts day to day.",
  viewer: "Read boards and sign off floor tasks with a PIN.",
  floor: "Submit pulls and sign off traveler checklists on the shop floor.",
}

export function StartHereCards() {
  const { role, setRole } = useHelpRoleFilter()

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {HELP_ROLES.map((r) => {
        const active = role === r.value
        const recommended = helpChapters.filter((c) => c.recommendedFor.includes(r.value)).slice(0, 3)

        return (
          <Card
            key={r.value}
            className={cn(
              "cursor-pointer ring-1 transition-colors",
              active ? "ring-[var(--orange)] bg-[var(--orange-muted)]" : "ring-foreground/10 hover:ring-foreground/20"
            )}
            onClick={() => setRole(active ? null : r.value)}
          >
            <CardHeader>
              <CardTitle className="text-sm">{r.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">{ROLE_BLURBS[r.value]}</p>
              {active && (
                <ul className="space-y-1 pt-1">
                  {recommended.map((chapter) => {
                    const Icon = HELP_ICONS[chapter.iconName]
                    return (
                      <li key={chapter.slug}>
                        <Link
                          href={`/help/${chapter.slug}?role=${r.value}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-xs font-medium text-[var(--orange)] hover:underline"
                        >
                          <Icon className="size-3 shrink-0" aria-hidden="true" />
                          {chapter.title}
                          <ArrowRight className="size-3 shrink-0" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
