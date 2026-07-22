"use client"

import { useEffect } from "react"

/** Registers the Material Pull service worker (push + offline shell). */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        console.error("[pwa] SW registration failed", err)
      })
  }, [])

  return null
}
