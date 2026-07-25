"use client"

import { ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { resolveQbCustomerUrl } from "@/lib/quickbooks-links"

interface QbLinkChipProps {
  url?: string | null
  customerId?: string | null
  statusNote?: string | null
  /** Label prefix — default "QB Customer" */
  label?: string
  className?: string
}

export function QbLinkChip({
  url,
  customerId,
  statusNote,
  label = "QB Customer",
  className,
}: QbLinkChipProps) {
  const href = resolveQbCustomerUrl({
    qbCustomerUrl: url,
    qbCustomerId: customerId,
  })

  if (!href) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex"
      >
        <Badge
          variant="secondary"
          className="text-xs gap-1 cursor-pointer hover:bg-muted border"
        >
          {label}
          <span className="text-muted-foreground">→</span>
          Open in QuickBooks
          <ExternalLink className="size-3 opacity-70" />
        </Badge>
      </a>
      {statusNote?.trim() ? (
        <Badge variant="outline" className="text-[10px] font-normal">
          {statusNote.trim()}
        </Badge>
      ) : null}
    </div>
  )
}
