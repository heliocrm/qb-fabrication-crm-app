"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { signInWithEmail, signUpWithEmail } from "@/lib/auth-actions"
import { createClient } from "@/lib/supabase/client"

interface LoginFormProps {
  redirectTo: string
  supabaseReady: boolean
}

export function LoginForm({ redirectTo, supabaseReady }: LoginFormProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin")
  const [loading, setLoading] = useState<"email" | "google" | "forgot" | null>(null)
  const [googleError, setGoogleError] = useState<string | null>(null)
  const [forgotMessage, setForgotMessage] = useState<string | null>(null)
  const [forgotError, setForgotError] = useState<string | null>(null)

  async function handleEmailSubmit(formData: FormData) {
    setLoading("email")
    formData.set("redirectTo", redirectTo)
    if (mode === "signin") {
      await signInWithEmail(formData)
    } else {
      await signUpWithEmail(formData)
    }
    setLoading(null)
  }

  async function handleForgotPassword(formData: FormData) {
    setForgotError(null)
    setForgotMessage(null)
    setLoading("forgot")

    const email = String(formData.get("email") ?? "")
    const callbackUrl = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent("/auth/reset-password")}`

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrl,
      })

      if (error) {
        setForgotError(error.message)
      } else {
        setForgotMessage("Check your email for a password reset link.")
      }
    } catch {
      setForgotError("Could not send reset email. Please try again.")
    }

    setLoading(null)
  }

  async function handleGoogleSignIn() {
    setGoogleError(null)
    setLoading("google")
    try {
      const supabase = createClient()
      const callbackUrl = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl },
      })

      if (error) {
        setGoogleError(error.message)
        setLoading(null)
        return
      }

      if (data.url) {
        window.location.assign(data.url)
      } else {
        setGoogleError("Could not start Google sign-in. Please try again.")
        setLoading(null)
      }
    } catch {
      setGoogleError("Could not start Google sign-in. Please try again.")
      setLoading(null)
    }
  }

  if (!supabaseReady) {
    return null
  }

  if (mode === "forgot") {
    return (
      <div className="space-y-6">
        <form action={handleForgotPassword} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@qbfabrication.com"
              required
              autoComplete="email"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0"
            disabled={loading !== null}
          >
            {loading === "forgot" && <Loader2 className="size-4 animate-spin" data-icon="inline-start" />}
            Send reset link
          </Button>
        </form>

        {forgotError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {forgotError}
          </div>
        )}

        {forgotMessage && (
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 p-3 text-sm text-green-800 dark:text-green-200">
            {forgotMessage}
          </div>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setMode("signin")
              setForgotError(null)
              setForgotMessage(null)
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <form action={handleEmailSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@qbfabrication.com"
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            {mode === "signin" && (
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </button>
            )}
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0"
          disabled={loading !== null}
        >
          {loading === "email" && <Loader2 className="size-4 animate-spin" data-icon="inline-start" />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {mode === "signin"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>

      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
          or
        </span>
      </div>

      {googleError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {googleError}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={handleGoogleSignIn}
        disabled={loading !== null}
      >
        {loading === "google" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        Continue with Google
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Enable Google provider in your{" "}
        <a
          href="https://supabase.com/dashboard/project/wkutsmgonkawgbidinwx/auth/providers"
          className="underline hover:text-foreground"
          target="_blank"
          rel="noopener noreferrer"
        >
          Supabase Auth settings
        </a>
        .
      </p>
    </div>
  )
}
