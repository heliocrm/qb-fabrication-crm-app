"use client"

import { useEffect } from "react"
import { PageError } from "@/components/ui/page-error"

export default function ShellError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <PageError
      message={error.message || "An unexpected error occurred while loading this page."}
      reset={reset}
    />
  )
}
