import { Suspense } from "react"
import { HelpShell } from "@/components/help/help-shell"

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <HelpShell>{children}</HelpShell>
    </Suspense>
  )
}
