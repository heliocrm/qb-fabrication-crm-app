"use client"

import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { HELP_ROLES, type HelpRole } from "@/lib/help/types"

const VALID_ROLES = new Set(HELP_ROLES.map((r) => r.value))

/** Shares the selected role filter chip across the Help Center via a
 *  ?role= query param, so it's shareable via link and persists on navigation. */
export function useHelpRoleFilter(defaultRole?: HelpRole | null) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const rawRole = searchParams.get("role")
  const role: HelpRole | null =
    rawRole && VALID_ROLES.has(rawRole as HelpRole)
      ? (rawRole as HelpRole)
      : defaultRole ?? null

  const setRole = useCallback(
    (next: HelpRole | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next) {
        params.set("role", next)
      } else {
        params.delete("role")
      }
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  return { role, setRole }
}
