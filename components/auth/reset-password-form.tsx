"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export function ResetPasswordForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)

    const password = String(formData.get("password") ?? "")
    const confirm = String(formData.get("confirm") ?? "")

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      setLoading(false)
      return
    }

    if (password !== confirm) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      router.push("/")
      router.refresh()
    } catch {
      setError("Could not update password. Please request a new reset link.")
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          New password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="confirm" className="text-sm font-medium text-foreground">
          Confirm password
        </label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          placeholder="••••••••"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0"
        disabled={loading}
      >
        {loading && <Loader2 className="size-4 animate-spin" data-icon="inline-start" />}
        Update password
      </Button>
    </form>
  )
}
