"use client"

import Link from "next/link"
import { LogOut, Settings, User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/lib/auth-actions"
import { cn } from "@/lib/utils"

export interface UserProfile {
  name: string
  email?: string
  role: string
  initials: string
  organizationRole?: string
}

interface UserMenuProps {
  user?: UserProfile | null
  variant?: "avatar" | "sidebar"
}

const defaultUser: UserProfile = {
  name: "Ivy Chen",
  email: "ivy@qbfabrication.com",
  role: "Project Manager",
  initials: "IC",
}

export function UserMenu({ user, variant = "avatar" }: UserMenuProps) {
  const profile = user ?? defaultUser

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          variant === "sidebar" ? (
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                "hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              )}
            >
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-[var(--orange)] text-white text-xs font-bold">
                  {profile.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-xs font-semibold text-sidebar-foreground">
                  {profile.name}
                </p>
                <p className="truncate text-[10px] text-sidebar-foreground/60">
                  {profile.role}
                </p>
              </div>
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border-0 bg-transparent p-0.5 transition-all hover:ring-2 hover:ring-[var(--orange)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-[var(--orange)] text-white text-xs font-bold">
                  {profile.initials}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">User menu</span>
            </button>
          )
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold">{profile.name}</span>
            {profile.email && (
              <span className="text-xs text-muted-foreground truncate">{profile.email}</span>
            )}
            <span className="text-xs text-muted-foreground">{profile.role}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />}>
          <User className="size-4" data-icon="inline-start" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings className="size-4" data-icon="inline-start" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => signOut()}
        >
          <LogOut className="size-4" data-icon="inline-start" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
