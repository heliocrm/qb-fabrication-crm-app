"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { GlobalSearch } from "@/components/global-search"
import { NotificationsMenu } from "@/components/notifications-menu"
import { UserMenu, type UserProfile } from "@/components/user-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"

interface TopNavProps {
  user?: UserProfile | null
}

export function TopNav({ user }: TopNavProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border/80 bg-card/95 px-4 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/80">
      <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />

      <GlobalSearch />

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Link href="/jobs/new" className="sm:hidden">
          <Button
            size="icon"
            className="size-9 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0 shadow-sm"
            aria-label="New job"
          >
            <Plus className="size-4" />
          </Button>
        </Link>
        <Link href="/jobs/new" className="hidden sm:block">
          <Button
            size="sm"
            className="gap-1.5 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0 shadow-sm"
          >
            <Plus className="size-4" data-icon="inline-start" />
            New Job
          </Button>
        </Link>

        <Separator orientation="vertical" className="hidden sm:block h-6" />

        <ThemeToggle />
        <NotificationsMenu />
        <UserMenu user={user} />
      </div>
    </header>
  )
}
