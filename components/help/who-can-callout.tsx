"use client"

import { Users } from "lucide-react"
import { roleMatchesText } from "@/lib/help/roles"
import { useHelpRoleFilter } from "@/lib/help/use-help-role-filter"
import { cn } from "@/lib/utils"

interface WhoCanCalloutProps {
  text: string
  className?: string
}

export function WhoCanCallout({ text, className }: WhoCanCalloutProps) {
  const { role } = useHelpRoleFilter()
  const applies = role ? roleMatchesText(role, text) : null

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs",
        applies === false
          ? "border-border bg-muted/40 text-muted-foreground"
          : "border-[var(--orange)]/25 bg-[var(--orange-muted)] text-foreground",
        className
      )}
    >
      <Users className="mt-0.5 size-3.5 shrink-0 text-[var(--orange)]" aria-hidden="true" />
      <p>
        <span className="font-semibold">Who can do this:</span> {text}
        {applies === false && (
          <span className="ml-1.5 text-muted-foreground">
            — probably not your current role filter
          </span>
        )}
      </p>
    </div>
  )
}
