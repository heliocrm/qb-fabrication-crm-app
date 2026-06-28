import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function NewJobPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Job</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Create a new fabrication job — coming soon
        </p>
      </div>
      <Card className="border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
          <Plus className="size-12 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Job creation form is under development. Browse existing jobs or return to the dashboard.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button render={<Link href="/jobs" />}>View jobs</Button>
            <Button variant="outline" render={<Link href="/" />}>
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
