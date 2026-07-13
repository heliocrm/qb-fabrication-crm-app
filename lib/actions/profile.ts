"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  getOwnProfile,
  updateNotificationPreferences,
  updateOwnProfile,
} from "@/lib/supabase/services/profiles"
import type { NotificationPreferences, OwnProfile } from "@/types"

type ActionResult<T> = { data?: T; error?: string }

export async function updateProfileAction(input: {
  fullName: string
  avatarInitials?: string
}): Promise<ActionResult<OwnProfile>> {
  try {
    const data = await updateOwnProfile({
      fullName: input.fullName.trim(),
      avatarInitials: input.avatarInitials?.trim().slice(0, 3).toUpperCase(),
    })
    revalidatePath("/profile")
    revalidatePath("/", "layout")
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update profile" }
  }
}

export async function updateNotificationPreferencesAction(
  prefs: NotificationPreferences
): Promise<ActionResult<OwnProfile>> {
  try {
    const data = await updateNotificationPreferences(prefs)
    revalidatePath("/profile")
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update preferences" }
  }
}

export async function changePasswordAction(input: {
  password: string
  confirm: string
}): Promise<ActionResult<void>> {
  if (input.password.length < 6) {
    return { error: "Password must be at least 6 characters." }
  }
  if (input.password !== input.confirm) {
    return { error: "Passwords do not match." }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password: input.password })
    if (error) return { error: error.message }
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to change password" }
  }
}

export async function uploadAvatarAction(
  formData: FormData
): Promise<ActionResult<OwnProfile>> {
  try {
    const file = formData.get("avatar") as File | null
    if (!file || file.size === 0) {
      return { error: "No file selected" }
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowed.includes(file.type)) {
      return { error: "Please upload a JPEG, PNG, WebP, or GIF image." }
    }
    if (file.size > 2 * 1024 * 1024) {
      return { error: "Image must be under 2 MB." }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg"
    const path = `${user.id}/avatar.${ext}`

    // Remove previous avatar files with other extensions so only one mark remains
    const { data: existing } = await supabase.storage.from("avatars").list(user.id)
    if (existing?.length) {
      const stale = existing
        .map((f) => `${user.id}/${f.name}`)
        .filter((p) => p !== path)
      if (stale.length > 0) {
        await supabase.storage.from("avatars").remove(stale)
      }
    }

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" })

    if (uploadError) return { error: uploadError.message }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path)

    // Cache-bust so top nav / layout AvatarImage updates immediately
    const cacheBust = `${publicUrl}?v=${Date.now()}`
    const data = await updateOwnProfile({ avatarUrl: cacheBust })

    revalidatePath("/profile")
    revalidatePath("/", "layout")
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to upload avatar" }
  }
}

export async function loadOwnProfileAction(): Promise<ActionResult<OwnProfile>> {
  try {
    const data = await getOwnProfile()
    if (!data) return { error: "Profile not found" }
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load profile" }
  }
}
