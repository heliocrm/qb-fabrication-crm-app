import { MaterialRequestForm } from "@/components/material-requests/material-request-form"

export const metadata = {
  title: "New Pull Request",
}

export default function PullNewPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">New request</h1>
        <p className="text-sm text-muted-foreground">
          Takes under a minute. Goes straight to Eric’s queue.
        </p>
      </div>
      <MaterialRequestForm redirectTo="/pull" compact />
    </div>
  )
}
