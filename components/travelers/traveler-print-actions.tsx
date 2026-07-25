"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TravelerPrintActions({
  backHref,
  autoPrint = false,
}: {
  backHref: string
  autoPrint?: boolean
}) {
  useEffect(() => {
    if (!autoPrint) return
    const t = window.setTimeout(() => window.print(), 250)
    return () => window.clearTimeout(t)
  }, [autoPrint])

  return (
    <div className="print:hidden sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background/95 backdrop-blur px-4 py-3">
      <Link href={backHref} className="inline-flex">
        <Button type="button" variant="ghost" size="sm" className="min-h-10 gap-1.5">
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </Link>
      <Button
        type="button"
        size="sm"
        className="min-h-10 gap-1.5"
        onClick={() => window.print()}
      >
        <Printer className="size-4" />
        Print
      </Button>
    </div>
  )
}
