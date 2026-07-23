import Link from "next/link"
import { BrandLogo } from "@/components/brand-logo"
import { PullNav } from "@/components/material-requests/pull-nav"
import { PullPwaToolbar } from "@/components/material-requests/pull-pwa-toolbar"
import { getSessionContext } from "@/lib/auth/session"
import { PULL_SHELL_WIDTH } from "@/lib/pull-layout"
import { isPullStandalone } from "@/lib/pull-mode"
import { getUserProfile } from "@/lib/supabase/provision"
import { cn } from "@/lib/utils"

export default async function PullLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, pullStandalone, ctx] = await Promise.all([
    getUserProfile(),
    isPullStandalone(),
    getSessionContext(),
  ])

  return (
    <div className="min-h-svh bg-background flex flex-col supports-[padding:max(0px)]:pb-[env(safe-area-inset-bottom)]">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 pt-[env(safe-area-inset-top)]">
        <div
          className={cn(
            PULL_SHELL_WIDTH,
            "px-4 py-3 flex items-center justify-between gap-3"
          )}
        >
          <Link
            href="/pull"
            className="flex items-center gap-2 min-w-0 min-h-11"
          >
            <BrandLogo size="sm" />
            <span className="text-sm font-semibold truncate sm:text-base">
              Material Pull
            </span>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <span className="text-xs text-muted-foreground max-w-[120px] truncate sm:text-sm">
                {user.name?.split(" ")[0] ?? "User"}
              </span>
            ) : null}
            {!pullStandalone ? (
              <Link
                href="/"
                className="text-xs text-muted-foreground underline-offset-4 hover:underline min-h-11 inline-flex items-center px-1"
              >
                Full CRM
              </Link>
            ) : null}
          </div>
        </div>
        <PullNav role={ctx?.role ?? "viewer"} />
      </header>
      <main
        className={cn(
          PULL_SHELL_WIDTH,
          "flex-1 px-4 py-4 pb-28 md:px-6 md:py-6"
        )}
      >
        {children}
      </main>
      <PullPwaToolbar />
    </div>
  )
}
