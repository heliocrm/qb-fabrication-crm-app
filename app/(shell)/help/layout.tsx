import { Suspense } from "react"
import { HelpShell } from "@/components/help/help-shell"
import { HelpUserProvider } from "@/components/help/help-user-context"
import { getSessionContext } from "@/lib/auth/session"
import { isSupabaseConfigured } from "@/lib/supabase/env"

export default async function HelpLayout({ children }: { children: React.ReactNode }) {
  const ctx = isSupabaseConfigured() ? await getSessionContext() : null

  return (
    <HelpUserProvider userId={ctx?.userId}>
      <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
        <HelpShell>{children}</HelpShell>
      </Suspense>
    </HelpUserProvider>
  )
}
