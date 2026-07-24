"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  canBatchMaterialRequests,
  canCreateMaterialRequests,
} from "@/lib/auth/permissions"
import { PULL_SHELL_WIDTH } from "@/lib/pull-layout"
import { cn } from "@/lib/utils"
import type { MaterialPullCapabilities, OrganizationRole } from "@/types"
import { DEFAULT_MATERIAL_PULL_CAPABILITIES } from "@/types/Profile"

const allTabs = [
  { href: "/pull", label: "Requests", exact: true, requires: "view" as const },
  { href: "/pull/new", label: "New", exact: false, requires: "request" as const },
  { href: "/pull/batch", label: "Batch", exact: false, requires: "batch" as const },
]

export function PullNav({
  role,
  capabilities = DEFAULT_MATERIAL_PULL_CAPABILITIES,
}: {
  role: OrganizationRole
  capabilities?: MaterialPullCapabilities
}) {
  const pathname = usePathname()
  const canRequest = canCreateMaterialRequests(role, capabilities)
  const canBatch = canBatchMaterialRequests(role, capabilities)
  const tabs = allTabs.filter((t) => {
    if (t.requires === "batch") return canBatch
    if (t.requires === "request") return canRequest
    return true
  })

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
