import Link from "next/link"
import { BrandLogo } from "@/components/brand-logo"
import { LoginForm } from "@/components/auth/login-form"
import { getPullHomePath, isPullStandalone } from "@/lib/pull-mode"
import { isSupabaseConfigured } from "@/lib/supabase/env"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; redirectTo?: string }>
}) {
  const params = await searchParams
  const supabaseReady = isSupabaseConfigured()
  const pullStandalone = await isPullStandalone()
  const pullHome = getPullHomePath()
  const defaultRedirect = pullStandalone ? pullHome : "/"
  const redirectTo = params.redirectTo ?? defaultRedirect

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[var(--navy)] text-white p-12">
        <div className="flex items-center">
          <BrandLogo size="lg" priority className="brightness-110" />
        </div>

        <div className="space-y-4 max-w-md">
          {pullStandalone ? (
            <>
              <h1 className="text-3xl font-bold leading-tight">
                QB Material Pull
              </h1>
              <p className="text-white/70 text-sm leading-relaxed">
                Request material, source it, and batch pull lists for the floor —
                one place for Eric, Tristan, and the shop.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold leading-tight">
                CRM + Job Management for steel fabrication
              </h1>
              <p className="text-white/70 text-sm leading-relaxed">
                Clarity from estimate to ship date. Track work, coordinate the floor,
                and keep every stakeholder aligned as jobs move through the shop.
              </p>
            </>
          )}
        </div>

        <p className="text-xs text-white/40">
          © {new Date().getFullYear()} QB Fabrication. All rights reserved.
        </p>
      </div>

      {/* Login form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center justify-center">
            <BrandLogo size="md" priority />
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              {pullStandalone
                ? "Sign in to submit and manage material pull requests"
                : "Access your dashboard, jobs, and pipeline"}
            </p>
          </div>

          {!supabaseReady && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-4 text-sm space-y-2">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Supabase not configured
              </p>
              <p className="text-amber-700 dark:text-amber-300/80 text-xs leading-relaxed">
                Copy <code className="font-mono">.env.local.example</code> to{" "}
                <code className="font-mono">.env.local</code> and add your project keys from the{" "}
                <a
                  href="https://supabase.com/dashboard/project/wkutsmgonkawgbidinwx/settings/api"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Supabase dashboard
                </a>
                . Until then, you can browse with mock data.
              </p>
              <Link
                href={pullStandalone ? pullHome : "/"}
                className="inline-block text-xs font-semibold text-[var(--orange)] hover:underline mt-1"
              >
                Continue with mock data →
              </Link>
            </div>
          )}

          {params.error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {params.error}
            </div>
          )}

          {params.message && (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 p-3 text-sm text-green-800 dark:text-green-200">
              {params.message}
            </div>
          )}

          <LoginForm redirectTo={redirectTo} supabaseReady={supabaseReady} />
        </div>
      </div>
    </div>
  )
}
