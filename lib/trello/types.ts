export type TrelloList = {
  id: string
  name: string
  closed: boolean
  pos: number
}

export type TrelloCheckItem = {
  id: string
  name: string
  state: "complete" | "incomplete" | string
  pos: number
}

export type TrelloChecklist = {
  id: string
  name: string
  checkItems: TrelloCheckItem[]
}

export type TrelloCard = {
  id: string
  name: string
  desc: string
  idList: string
  closed: boolean
  due: string | null
  pos: number
  labels: { id: string; name: string; color: string | null }[]
  checklists?: TrelloChecklist[]
}

export type TrelloBoard = {
  id: string
  name: string
  desc: string
  closed: boolean
  url: string
  lists: TrelloList[]
  cards: TrelloCard[]
}
