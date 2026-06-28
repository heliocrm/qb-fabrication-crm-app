"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSiteUrl, isSupabaseConfigured } from "@/lib/supabase/env"

export async function signInWithEmail(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/")
  }

  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const redirectTo = String(formData.get("redirectTo") ?? "/")

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}&redirectTo=${encodeURIComponent(redirectTo)}`)
  }

  redirect(redirectTo)
}

export async function signUpWithEmail(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/")
  }

  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const redirectTo = String(formData.get("redirectTo") ?? "/")

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
    },
  })

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}&redirectTo=${encodeURIComponent(redirectTo)}`)
  }

  redirect(`/auth/login?message=${encodeURIComponent("Check your email to confirm your account.")}`)
}

export async function signInWithGoogle(redirectTo: string = "/") {
  if (!isSupabaseConfigured()) {
    redirect("/")
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
    },
  })

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signOut() {
  if (!isSupabaseConfigured()) {
    redirect("/auth/login")
  }

  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
