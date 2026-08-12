"use client"

import { HELP_ROLES, type HelpRole } from "@/lib/help/types"
import { useHelpRoleFilter } from "@/lib/help/use-help-role-filter"
import { cn } from "@/lib/utils"

interface RoleFilterChipsProps {
  className?: string
  label?: string
}

export function RoleFilterChips({ className, label = "Filter by role" }: RoleFilterChipsProps) {
  const { role, setRole } = useHelpRoleFilter()

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Role filter">
        <button
          type="button"
          onClick={() => setRole(null)}
          aria-pressed={role === null}
          className={cn(
            "h-7 rounded-full border px-3 text-xs font-medium transition-colors",
            role === null
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          All roles
        </button>
        {HELP_ROLES.map((r) => (
          <RoleChip key={r.value} value={r.value} label={r.label} active={role === r.value} onSelect={setRole} />
        ))}
      </div>
    </div>
  )
}

function RoleChip({
  value,
  label,
  active,
  onSelect,
}: {
  value: HelpRole
  label: string
  active: boolean
  onSelect: (role: HelpRole) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={active}
      className={cn(
        "h-7 rounded-full border px-3 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {label}
    </button>
  )
}
