import Link from "next/link"
import { Wrench } from "lucide-react"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"

export default async function ResetPasswordPage() {
  const supabaseReady = isSupabaseConfigured()
  let hasSession = false

  if (supabaseReady) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    hasSession = Boolean(user)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex items-center gap-3 justify-center">
          <div className="flex size-9 items-center justify-center rounded-md bg-[var(--orange)]">
            <Wrench className="size-5 text-white" />
          </div>
          <span className="font-bold text-foreground">QB Fabrication</span>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">Set a new password</h1>
          <p className="text-sm text-muted-foreground">
            Choose a new password for your account
          </p>
        </div>

        {!supabaseReady && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-4 text-sm text-amber-800 dark:text-amber-200">
            Supabase is not configured.
          </div>
        )}

        {supabaseReady && !hasSession && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive space-y-3">
            <p>This reset link is invalid or has expired.</p>
            <Link href="/auth/login" className="inline-block text-sm font-medium underline">
              Back to sign in
            </Link>
          </div>
        )}

        {supabaseReady && hasSession && <ResetPasswordForm />}
      </div>
    </div>
  )
}
