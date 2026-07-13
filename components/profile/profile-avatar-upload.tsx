"use client"

import { useRef, useState } from "react"
import { Camera, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { uploadAvatarAction } from "@/lib/actions/profile"
import { toast } from "@/lib/toast"
import type { OwnProfile } from "@/types"

interface ProfileAvatarUploadProps {
  profile: OwnProfile
  onUpdated: (profile: OwnProfile) => void
}

export function ProfileAvatarUpload({ profile, onUpdated }: ProfileAvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.set("avatar", file)

    const result = await uploadAvatarAction(formData)
    setIsUploading(false)

    if (result.error) {
      toast.error("Upload failed", result.error)
      return
    }

    if (result.data) {
      onUpdated(result.data)
      toast.success("Avatar updated")
    }

    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <div className="relative">
        <Avatar className="size-20">
          {profile.avatarUrl && (
            <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
          )}
          <AvatarFallback className="bg-[var(--orange)] text-white text-xl font-bold">
            {profile.avatarInitials}
          </AvatarFallback>
        </Avatar>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="absolute -bottom-1 -right-1 size-8 rounded-full p-0 shadow-md"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          aria-label="Change avatar"
        >
          {isUploading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Camera className="size-3.5" />
          )}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={handleFileChange}
        />
      </div>
      <div className="text-center sm:text-left">
        <p className="text-sm font-semibold text-foreground">{profile.fullName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
        <p className="text-xs text-muted-foreground capitalize mt-1">{profile.role}</p>
      </div>
    </div>
  )
}
