import Link from "next/link"
import { BrandLogo } from "@/components/brand-logo"
import { TravelerPwaToolbar } from "@/components/travelers/traveler-pwa-toolbar"
import { getSessionContext } from "@/lib/auth/session"
import { TRAVELER_SHELL_WIDTH } from "@/lib/traveler-layout"
import { isTravelerStandalone } from "@/lib/traveler-mode"
import { getUserProfile } from "@/lib/supabase/provision"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "QB Traveler",
  manifest: "/traveler.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default" as const,
    title: "QB Traveler",
  },
}

export default async function TravelerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, travelerStandalone] = await Promise.all([
    getUserProfile(),
    isTravelerStandalone(),
  ])
  await getSessionContext()

  return (
    <div className="min-h-svh bg-background flex flex-col supports-[padding:max(0px)]:pb-[env(safe-area-inset-bottom)]">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 pt-[env(safe-area-inset-top)]">
        <div
          className={cn(
            TRAVELER_SHELL_WIDTH,
            "px-4 py-3 flex items-center justify-between gap-3"
          )}
        >
          <Link
            href="/traveler"
            className="flex items-center gap-2 min-w-0 min-h-11"
          >
            <BrandLogo size="sm" />
            <span className="text-sm font-semibold truncate sm:text-base">
              Traveler
            </span>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <span className="text-xs text-muted-foreground max-w-[120px] truncate sm:text-sm">
                {user.name?.split(" ")[0] ?? "User"}
              </span>
            ) : null}
            {!travelerStandalone ? (
              <Link
                href="/"
                className="text-xs text-muted-foreground underline-offset-4 hover:underline min-h-11 inline-flex items-center px-1"
              >
                Full CRM
              </Link>
            ) : null}
          </div>
        </div>
      </header>
      <main
        className={cn(
          TRAVELER_SHELL_WIDTH,
          "flex-1 w-full px-4 py-4 pb-24"
        )}
      >
        {children}
      </main>
      <TravelerPwaToolbar />
    </div>
  )
}
