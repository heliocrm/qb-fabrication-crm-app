import { Card, CardContent } from "@/components/ui/card"
import { Building2 } from "lucide-react"

export function OrgSettingsPlaceholder() {
  return (
    <Card className="border shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-20 gap-3">
        <Building2 className="size-12 text-muted-foreground/40" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">Organization Settings</p>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Company name, branding, integrations, and notification defaults — coming soon.
        </p>
      </CardContent>
    </Card>
  )
}
