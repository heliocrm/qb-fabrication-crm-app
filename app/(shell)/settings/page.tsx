import { Settings } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Application preferences and integrations — coming soon
        </p>
      </div>
      <Card className="border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-20 gap-3">
          <Settings className="size-12 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Settings module coming soon</p>
        </CardContent>
      </Card>
    </div>
  )
}
