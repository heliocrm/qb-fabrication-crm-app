"use client"

import { useEffect } from "react"
import { PageError } from "@/components/ui/page-error"

export default function RootError({
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
      title="Application error"
      message={error.message || "Something went wrong. Please try again."}
      reset={reset}
    />
  )
}
