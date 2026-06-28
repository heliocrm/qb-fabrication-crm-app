"use client"

import { Bell, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-card px-4 shadow-sm">
      <SidebarTrigger className="-ml-1" />

      <div className="relative hidden md:flex flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs, POs, customers…"
          className="pl-9 h-9 bg-background text-sm"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link href="/jobs">
          <Button size="sm" className="hidden sm:flex gap-1.5 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0">
            <Plus data-icon="inline-start" />
            New Job
          </Button>
        </Link>

        {/* Notifications dropdown — render trigger as a styled div to avoid nested button */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="relative inline-flex size-9 items-center justify-center rounded-lg border-0 bg-transparent text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Bell className="size-4" />
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500" />
                <span className="sr-only">Notifications</span>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-0.5 py-3">
              <div className="flex items-center gap-2 w-full">
                <Badge variant="destructive" className="text-xs">Urgent</Badge>
                <span className="text-xs text-muted-foreground ml-auto">2h ago</span>
              </div>
              <p className="text-sm font-medium">QB-2025-041 delivery in 6 weeks</p>
              <p className="text-xs text-muted-foreground">BPA McNary – galvanize step not started</p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-0.5 py-3">
              <div className="flex items-center gap-2 w-full">
                <Badge className="text-xs bg-orange-500 text-white">Change Order</Badge>
                <span className="text-xs text-muted-foreground ml-auto">5h ago</span>
              </div>
              <p className="text-sm font-medium">BPA Rev D brackets – pending approval</p>
              <p className="text-xs text-muted-foreground">$18,200 impact on QB-2025-041</p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-sm text-muted-foreground justify-center">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-full border-0 bg-transparent p-0 hover:ring-2 hover:ring-ring transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-[var(--orange)] text-white text-xs font-bold">IC</AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-semibold">Ivy Chen</span>
                <span className="text-xs text-muted-foreground font-normal">Project Manager</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Switch to James Nguyen</DropdownMenuItem>
            <DropdownMenuItem>Switch to Cuong Tran</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
