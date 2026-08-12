"use client"

import { createContext, useContext } from "react"

/** Falls back to a shared bucket when no signed-in user id is available. */
const GUEST_HELP_USER_ID = "guest"

const HelpUserContext = createContext<string>(GUEST_HELP_USER_ID)

export function HelpUserProvider({
  userId,
  children,
}: {
  userId: string | null | undefined
  children: React.ReactNode
}) {
  return (
    <HelpUserContext.Provider value={userId || GUEST_HELP_USER_ID}>
      {children}
    </HelpUserContext.Provider>
  )
}

/** The id used to namespace per-user Help Center state (e.g. tour progress) in localStorage. */
export function useHelpUserId(): string {
  return useContext(HelpUserContext)
}
