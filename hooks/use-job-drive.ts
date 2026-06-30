"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import {
  createJobDriveFolderAction,
  listJobDriveFilesAction,
  uploadJobDriveFileAction,
} from "@/lib/actions/google-drive"
import { toast } from "@/lib/toast"
import type { Document } from "@/types"

interface UseJobDriveOptions {
  jobId: string
  initialFolderId?: string | null
  initialDocuments?: Document[]
  enabled?: boolean
}

export function useJobDrive({
  jobId,
  initialFolderId,
  initialDocuments = [],
  enabled = true,
}: UseJobDriveOptions) {
  const [folderId, setFolderId] = useState(initialFolderId ?? null)
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)
  const [source, setSource] = useState<"drive" | "database" | "mock">("mock")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const refresh = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    setError(null)

    const result = await listJobDriveFilesAction(jobId)
    setIsLoading(false)

    if (result.error) {
      setError(result.error)
      toast.error("Could not load Drive files", result.error)
      return
    }

    if (result.data) {
      setDocuments(result.data.files)
      setSource(result.data.source)
    }
  }, [jobId, enabled])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function createFolder() {
    setError(null)
    startTransition(async () => {
      const result = await createJobDriveFolderAction(jobId)
      if (result.error) {
        setError(result.error)
        toast.error("Could not create Drive folder", result.error)
        return
      }
      if (result.data) {
        setFolderId(result.data.folderId)
        await refresh()
      }
    })
  }

  function uploadFile(file: File, lineItemId?: string | null) {
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.append("file", file)
      if (lineItemId) formData.append("lineItemId", lineItemId)

      const result = await uploadJobDriveFileAction(jobId, formData, lineItemId)
      if (result.error) {
        setError(result.error)
        toast.error("Upload failed", result.error)
        return
      }
      if (result.data?.document) {
        setDocuments((prev) => [result.data!.document, ...prev])
        setSource("drive")
        toast.success("File uploaded")
      }
    })
  }

  return {
    folderId,
    documents,
    source,
    error,
    isLoading,
    isPending,
    refresh,
    createFolder,
    uploadFile,
  }
}
