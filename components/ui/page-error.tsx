"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface PageErrorProps {
  title?: string
  message?: string
  reset?: () => void
}

export function PageError({
  title = "Something went wrong",
  message = "We couldn't load this page. Try again or return to the dashboard.",
  reset,
}: PageErrorProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4 sm:p-6">
      <Card className="border shadow-sm max-w-md w-full">
        <CardContent className="flex flex-col items-center gap-4 py-10 px-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {reset && (
              <Button onClick={reset} variant="default">
                Try again
              </Button>
            )}
            <Button variant="outline" render={<a href="/" />}>
              Go to dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
