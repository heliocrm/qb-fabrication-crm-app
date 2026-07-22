import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Offline",
}

export default function OfflinePage() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">You’re offline</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        QB Material Pull can’t reach the server right now. Reconnect to submit or
        update requests.
      </p>
      <Button render={<Link href="/pull" />}>Try again</Button>
    </div>
  )
}
