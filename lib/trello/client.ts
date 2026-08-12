import { requireTrelloConfig, type TrelloConfig } from "@/lib/trello/config"
import type {
  TrelloBoard,
  TrelloCard,
  TrelloChecklist,
  TrelloList,
} from "@/lib/trello/types"

const TRELLO_API = "https://api.trello.com/1"

async function trelloFetch<T>(
  path: string,
  config: TrelloConfig,
  query: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${TRELLO_API}${path}`)
  url.searchParams.set("key", config.apiKey)
  url.searchParams.set("token", config.token)
  for (const [k, v] of Object.entries(query)) {
    url.searchParams.set(k, v)
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(
      `Trello API ${res.status} on ${path}${body ? `: ${body.slice(0, 200)}` : ""}`
    )
  }

  return (await res.json()) as T
}

export async function listMemberBoards(
  config: TrelloConfig = requireTrelloConfig()
): Promise<{ id: string; name: string; closed: boolean; url: string; desc: string }[]> {
  const boards = await trelloFetch<
    { id: string; name: string; closed: boolean; url: string; desc: string }[]
  >("/members/me/boards", config, {
    fields: "name,closed,url,desc",
    filter: "open",
  })

  if (!config.boardIdsAllowlist) return boards
  const allow = new Set(config.boardIdsAllowlist)
  return boards.filter((b) => allow.has(b.id))
}

export async function fetchBoardBundle(
  boardId: string,
  config: TrelloConfig = requireTrelloConfig()
): Promise<TrelloBoard> {
  if (config.boardIdsAllowlist && !config.boardIdsAllowlist.includes(boardId)) {
    throw new Error(`Board ${boardId} is not in TRELLO_BOARD_IDS allowlist`)
  }

  const board = await trelloFetch<{
    id: string
    name: string
    desc: string
    closed: boolean
    url: string
    lists: TrelloList[]
    cards: (TrelloCard & { checklists?: TrelloChecklist[] })[]
  }>(`/boards/${boardId}`, config, {
    fields: "name,desc,closed,url",
    lists: "open",
    list_fields: "name,closed,pos",
    cards: "open",
    card_fields: "name,desc,idList,closed,due,pos,labels",
    checklists: "all",
    checklist_fields: "name",
    checkItems: "all",
    checkItem_fields: "name,state,pos",
  })

  // Nested checklists may be on board level separately depending on API;
  // ensure each card has checklists filtered by card.
  const allChecklists = await trelloFetch<
    (TrelloChecklist & { idCard: string })[]
  >(`/boards/${boardId}/checklists`, config, {
    fields: "name,idCard",
    checkItems: "all",
    checkItem_fields: "name,state,pos",
  })

  const byCard = new Map<string, TrelloChecklist[]>()
  for (const cl of allChecklists) {
    const list = byCard.get(cl.idCard) ?? []
    list.push({
      id: cl.id,
      name: cl.name,
      checkItems: (cl.checkItems ?? []).slice().sort((a, b) => a.pos - b.pos),
    })
    byCard.set(cl.idCard, list)
  }

  const cards: TrelloCard[] = (board.cards ?? [])
    .filter((c) => !c.closed)
    .map((c) => ({
      ...c,
      checklists: byCard.get(c.id) ?? c.checklists ?? [],
    }))
    .sort((a, b) => a.pos - b.pos)

  return {
    id: board.id,
    name: board.name,
    desc: board.desc ?? "",
    closed: board.closed,
    url: board.url,
    lists: (board.lists ?? [])
      .filter((l) => !l.closed)
      .slice()
      .sort((a, b) => a.pos - b.pos),
    cards,
  }
}
