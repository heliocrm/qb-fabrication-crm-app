export type TrelloConfig = {
  apiKey: string
  token: string
  /** When set, only these board ids are imported/refreshed */
  boardIdsAllowlist: string[] | null
}

export function isTrelloConfigured(): boolean {
  return Boolean(getTrelloApiKey() && getTrelloToken())
}

function getTrelloApiKey(): string | undefined {
  return process.env.TRELLO_API_KEY?.trim() || undefined
}

function getTrelloToken(): string | undefined {
  return (
    process.env.TRELLO_TOKEN?.trim() ||
    process.env.TRELLO_API_TOKEN?.trim() ||
    undefined
  )
}

function getBoardIdsAllowlist(): string[] | null {
  const raw = process.env.TRELLO_BOARD_IDS?.trim()
  if (!raw) return null
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  return ids.length > 0 ? ids : null
}

export function requireTrelloConfig(): TrelloConfig {
  const apiKey = getTrelloApiKey()
  const token = getTrelloToken()
  if (!apiKey || !token) {
    throw new Error(
      "Trello is not configured. Set TRELLO_API_KEY and TRELLO_TOKEN (or TRELLO_API_TOKEN)."
    )
  }
  return {
    apiKey,
    token,
    boardIdsAllowlist: getBoardIdsAllowlist(),
  }
}
