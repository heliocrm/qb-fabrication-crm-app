import Link from "next/link"
import { BrandLogo } from "@/components/brand-logo"
import { PullNav } from "@/components/material-requests/pull-nav"
import { PullPwaToolbar } from "@/components/material-requests/pull-pwa-toolbar"
import { isPullStandalone } from "@/lib/pull-mode"
import { getUserProfile } from "@/lib/supabase/provision"

export default async function PullLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, pullStandalone] = await Promise.all([
    getUserProfile(),
    isPullStandalone(),
  ])

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto max-w-lg px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/pull" className="flex items-center gap-2 min-w-0">
            <BrandLogo size="sm" />
            <span className="text-sm font-semibold truncate">Material Pull</span>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <span className="text-xs text-muted-foreground max-w-[100px] truncate">
                {user.name?.split(" ")[0] ?? "User"}
              </span>
            ) : null}
            {!pullStandalone ? (
              <Link
                href="/"
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Full CRM
              </Link>
            ) : null}
          </div>
        </div>
        <PullNav />
      </header>
      <main className="flex-1 mx-auto w-full max-w-lg px-4 py-4 pb-24">
        {children}
      </main>
      <PullPwaToolbar />
    </div>
  )
}
