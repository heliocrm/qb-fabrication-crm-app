import { ImageIcon } from "lucide-react"

interface HelpImageSlotProps {
  description: string
}

/** A visible placeholder for a future screenshot. Swap for a real image under
 *  public/help/... once the UI is stable — see docs/user-guide/00-outline.md. */
export function HelpImageSlot({ description }: HelpImageSlotProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
      <ImageIcon className="size-4 shrink-0" aria-hidden="true" />
      <span>
        <span className="font-medium text-foreground/80">Screenshot coming soon:</span>{" "}
        {description}
      </span>
    </div>
  )
}
