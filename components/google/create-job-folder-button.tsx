"use client"

import { FolderPlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { isGoogleDriveFolderId } from "@/lib/google/drive/urls"
import { cn } from "@/lib/utils"

interface CreateJobFolderButtonProps {
  folderId?: string | null
  onCreateFolder: () => void
  isPending?: boolean
  disabled?: boolean
  className?: string
  size?: "sm" | "default"
}

export function CreateJobFolderButton({
  folderId,
  onCreateFolder,
  isPending,
  disabled,
  className,
  size = "sm",
}: CreateJobFolderButtonProps) {
  const hasFolder = isGoogleDriveFolderId(folderId)

  if (hasFolder) return null

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={cn("gap-1.5", className)}
      onClick={onCreateFolder}
      disabled={disabled || isPending}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
      ) : (
        <FolderPlus className="size-4" data-icon="inline-start" />
      )}
      Create Job Folder in Drive
    </Button>
  )
}
