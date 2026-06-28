import Link from "next/link"
import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="border shadow-sm max-w-md w-full">
        <CardContent className="flex flex-col items-center gap-4 py-10 px-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileQuestion className="size-6" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-semibold text-foreground">Page not found</h1>
            <p className="text-sm text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist or was moved.
            </p>
          </div>
          <Button render={<Link href="/" />}>Back to dashboard</Button>
        </CardContent>
      </Card>
    </div>
  )
}
