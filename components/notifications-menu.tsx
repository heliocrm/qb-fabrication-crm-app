"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

const notifications = [
  {
    id: "n1",
    type: "urgent" as const,
    title: "QB-2025-041 delivery in 6 weeks",
    body: "BPA McNary – galvanize step not started",
    time: "2h ago",
    href: "/jobs/j1",
  },
  {
    id: "n2",
    type: "change-order" as const,
    title: "BPA Rev D brackets – pending approval",
    body: "$18,200 impact on QB-2025-041",
    time: "5h ago",
    href: "/jobs/j1",
  },
  {
    id: "n3",
    type: "info" as const,
    title: "PGE 21706 ready for QC sign-off",
    body: "Dimensional check due Jul 5",
    time: "1d ago",
    href: "/jobs/j2",
  },
]

export function NotificationsMenu() {
  const unreadCount = notifications.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative size-9">
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-[var(--orange)] text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span>Notifications</span>
          <Badge variant="secondary" className="text-[10px] font-normal">
            {unreadCount} new
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <ScrollArea className="max-h-72">
          {notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex flex-col items-start gap-1 rounded-none px-4 py-3 cursor-pointer"
              render={<Link href={n.href} />}
            >
                <div className="flex w-full items-center gap-2">
                  {n.type === "urgent" && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      Urgent
                    </Badge>
                  )}
                  {n.type === "change-order" && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-[var(--orange)] text-white border-0">
                      Change Order
                    </Badge>
                  )}
                  {n.type === "info" && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Update
                    </Badge>
                  )}
                  <span className="ml-auto text-[10px] text-muted-foreground">{n.time}</span>
                </div>
                <p className="text-sm font-medium leading-snug">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.body}</p>
            </DropdownMenuItem>
          ))}
        </ScrollArea>
        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem className="justify-center py-2.5 text-xs text-muted-foreground">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
