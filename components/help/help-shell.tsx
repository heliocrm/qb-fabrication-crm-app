"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { HelpChapterNav } from "@/components/help/help-chapter-nav"

export function HelpShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="mx-auto flex max-w-6xl gap-6 p-4 sm:p-6">
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-20">
          <HelpChapterNav />
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 lg:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-3.5" data-icon="inline-start" />
          Chapters
        </Button>

        {children}
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 overflow-y-auto p-4">
          <SheetHeader className="p-0 pb-2">
            <SheetTitle>Help Center</SheetTitle>
          </SheetHeader>
          <HelpChapterNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
