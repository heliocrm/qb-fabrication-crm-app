"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TRAVELER_SHELL_WIDTH } from "@/lib/traveler-layout"
import { cn } from "@/lib/utils"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function TravelerPwaToolbar() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  )
  const [installed, setInstalled] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    const ua = window.navigator.userAgent
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    setIsIos(ios)

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
    setInstalled(standalone)

    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }

    window.addEventListener("beforeinstallprompt", onBip)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  if (installed) return null

  if (deferred) {
    return (
      <div className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] print:hidden">
        <div
          className={cn(
            TRAVELER_SHELL_WIDTH,
            "flex items-center justify-between gap-3"
          )}
        >
          <p className="text-sm leading-snug">
            Install <span className="font-semibold">QB Traveler</span> for phone
            or tablet
          </p>
          <Button
            type="button"
            className="min-h-11 shrink-0 touch-manipulation"
            onClick={install}
          >
            <Download className="size-4" />
            Install
          </Button>
        </div>
      </div>
    )
  }

  if (!isIos) return null
  return <IosInstallHint />
}

function IosInstallHint() {
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      setDismissed(
        localStorage.getItem("qb-traveler-ios-install-dismissed") === "1"
      )
    } catch {
      setDismissed(false)
    }
    setReady(true)
  }, [])

  if (!ready || dismissed) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] print:hidden">
      <div className={cn(TRAVELER_SHELL_WIDTH, "space-y-2")}>
        <p className="text-sm leading-snug">
          <span className="font-semibold">iPhone / iPad:</span> tap Share, then{" "}
          <span className="font-medium">Add to Home Screen</span> to install.
        </p>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full touch-manipulation sm:w-auto"
          onClick={() => {
            try {
              localStorage.setItem("qb-traveler-ios-install-dismissed", "1")
            } catch {
              /* ignore */
            }
            setDismissed(true)
          }}
        >
          Got it
        </Button>
      </div>
    </div>
  )
}
