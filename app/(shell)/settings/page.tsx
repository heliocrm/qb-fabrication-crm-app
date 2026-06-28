import { Settings } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-2">Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">Application settings — coming soon.</p>
      <Card className="border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-20 gap-3">
          <Settings className="size-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Settings module coming soon</p>
        </CardContent>
      </Card>
    </div>
  )
}
