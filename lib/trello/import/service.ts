import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
} from "@/lib/supabase/schema"
import { syncJobProgress } from "@/lib/supabase/services/jobs"
import { requireTrelloConfig } from "@/lib/trello/config"
import { fetchBoardBundle, listMemberBoards } from "@/lib/trello/client"
import {
  deriveJobNumber,
  furthestJobStatus,
  inferJobTemplate,
  mapChecklistNameToCategory,
  mapListNameToJobStatus,
  mapListNameToWipStatus,
} from "@/lib/trello/map-status"
import type { TrelloBoard, TrelloCard } from "@/lib/trello/types"
import type { JobStatus, JobTemplateType } from "@/types"

export type TrelloImportMatch = "new" | "update"

export type TrelloImportPreviewRow = {
  boardId: string
  boardName: string
  boardUrl: string
  closed: boolean
  cardCount: number
  checklistItemCount: number
  listNames: string[]
  inferredStatus: JobStatus
  inferredTemplate: JobTemplateType
  proposedJobNumber: string
  match: TrelloImportMatch
  existingJobId: string | null
  existingJobNumber: string | null
}

export type TrelloCommitResult = {
  boardId: string
  jobId: string
  match: TrelloImportMatch
  cardsUpserted: number
  tasksUpserted: number
  orphanedLineItems: number
  orphanedTasks: number
}

export type TrelloRefreshResult = {
  jobsRefreshed: number
  cardsUpserted: number
  tasksUpserted: number
  orphanedLineItems: number
  orphanedTasks: number
  errors: { boardId: string; message: string }[]
}

function countCheckItems(board: TrelloBoard): number {
  let n = 0
  for (const card of board.cards) {
    for (const cl of card.checklists ?? []) {
      n += cl.checkItems?.length ?? 0
    }
  }
  return n
}

function listNameById(board: TrelloBoard): Map<string, string> {
  return new Map(board.lists.map((l) => [l.id, l.name]))
}

function inferBoardStatus(board: TrelloBoard): JobStatus {
  if (board.closed) return "Delivered"
  const lists = listNameById(board)
  const statuses: JobStatus[] = []
  for (const card of board.cards) {
    const listName = lists.get(card.idList) ?? ""
    const mapped = mapListNameToJobStatus(listName)
    if (mapped) statuses.push(mapped)
  }
  return furthestJobStatus(statuses)
}

function labelNamesFromBoard(board: TrelloBoard): string[] {
  const names = new Set<string>()
  for (const card of board.cards) {
    for (const label of card.labels ?? []) {
      if (label.name) names.add(label.name)
    }
  }
  return [...names]
}

function dueToDate(due: string | null): string | null {
  if (!due) return null
  const d = new Date(due)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

async function loadExistingByBoardIds(
  organizationId: string,
  boardIds: string[]
): Promise<Map<string, { id: string; job_number: string }>> {
  const map = new Map<string, { id: string; job_number: string }>()
  if (boardIds.length === 0) return map

  const supabase = await createClient()
  const { data, error } = await supabase
    .from(Tables.jobs)
    .select("id, job_number, trello_board_id")
    .eq("organization_id", organizationId)
    .in("trello_board_id", boardIds)

  throwOnError({ data, error })

  for (const row of data ?? []) {
    if (row.trello_board_id) {
      map.set(row.trello_board_id, {
        id: row.id,
        job_number: row.job_number,
      })
    }
  }
  return map
}

async function ensureUniqueJobNumber(
  desired: string,
  excludeJobId?: string
): Promise<string> {
  const supabase = await createClient()
  let candidate = desired.slice(0, 48)
  for (let i = 0; i < 20; i++) {
    const tryNumber = i === 0 ? candidate : `${candidate.slice(0, 40)}-${i + 1}`
    let q = supabase
      .from(Tables.jobs)
      .select("id")
      .eq("job_number", tryNumber)
      .limit(1)
    if (excludeJobId) {
      q = q.neq("id", excludeJobId)
    }
    const { data, error } = await q
    throwOnError({ data, error })
    if (!data || data.length === 0) return tryNumber
  }
  return `${candidate.slice(0, 32)}-${Date.now().toString(36)}`
}

export async function previewTrelloImport(): Promise<{
  rows: TrelloImportPreviewRow[]
  scanned: number
}> {
  const config = requireTrelloConfig()
  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)

  const boards = await listMemberBoards(config)
  const existing = await loadExistingByBoardIds(
    organizationId,
    boards.map((b) => b.id)
  )

  const rows: TrelloImportPreviewRow[] = []

  // Preview uses lightweight list first; enrich with card counts via board bundle
  // in parallel batches to avoid rate limits.
  const batchSize = 5
  for (let i = 0; i < boards.length; i += batchSize) {
    const slice = boards.slice(i, i + batchSize)
    const bundles = await Promise.all(
      slice.map(async (b) => {
        try {
          return await fetchBoardBundle(b.id, config)
        } catch (err) {
          // Fall back to empty board shell so preview still lists it
          return {
            id: b.id,
            name: b.name,
            desc: b.desc ?? "",
            closed: b.closed,
            url: b.url,
            lists: [],
            cards: [],
            _error: err instanceof Error ? err.message : "Failed to load",
          } as TrelloBoard & { _error?: string }
        }
      })
    )

    for (const board of bundles) {
      const match = existing.get(board.id)
      const labels = labelNamesFromBoard(board)
      rows.push({
        boardId: board.id,
        boardName: board.name,
        boardUrl: board.url,
        closed: board.closed,
        cardCount: board.cards.length,
        checklistItemCount: countCheckItems(board),
        listNames: board.lists.map((l) => l.name),
        inferredStatus: inferBoardStatus(board),
        inferredTemplate: inferJobTemplate(board.name, labels),
        proposedJobNumber: deriveJobNumber(board.name, board.id),
        match: match ? "update" : "new",
        existingJobId: match?.id ?? null,
        existingJobNumber: match?.job_number ?? null,
      })
    }
  }

  rows.sort((a, b) => a.boardName.localeCompare(b.boardName))
  return { rows, scanned: boards.length }
}

async function upsertTasksForCard(params: {
  organizationId: string
  jobId: string
  lineItemId: string
  card: TrelloCard
}): Promise<number> {
  const { organizationId, jobId, lineItemId, card } = params
  const supabase = await createClient()
  let upserted = 0
  let sortOrder = 0

  for (const checklist of card.checklists ?? []) {
    const category = mapChecklistNameToCategory(checklist.name)
    const items = (checklist.checkItems ?? [])
      .slice()
      .sort((a, b) => a.pos - b.pos)

    for (const item of items) {
      const completed = item.state === "complete"
      const { data: existing } = await supabase
        .from(Tables.tasks)
        .select("id")
        .eq("organization_id", organizationId)
        .eq("trello_checkitem_id", item.id)
        .maybeSingle()

      if (existing?.id) {
        const { error } = await supabase
          .from(Tables.tasks)
          .update({
            title: item.name,
            completed,
            category,
            sort_order: sortOrder,
            line_item_id: lineItemId,
            job_id: jobId,
          })
          .eq("id", existing.id)
        if (error) throwOnError({ data: null, error })
      } else {
        const { error } = await supabase.from(Tables.tasks).insert({
          organization_id: organizationId,
          job_id: jobId,
          line_item_id: lineItemId,
          title: item.name,
          completed,
          category,
          sort_order: sortOrder,
          trello_checkitem_id: item.id,
        })
        if (error) throwOnError({ data: null, error })
      }
      upserted += 1
      sortOrder += 1
    }
  }

  return upserted
}

async function upsertLineItemsForBoard(params: {
  organizationId: string
  jobId: string
  board: TrelloBoard
}): Promise<{ cardsUpserted: number; tasksUpserted: number; orphanedLineItems: number; orphanedTasks: number }> {
  const { organizationId, jobId, board } = params
  const supabase = await createClient()
  const lists = listNameById(board)
  let cardsUpserted = 0
  let tasksUpserted = 0

  const seenCardIds = new Set<string>()
  const seenCheckItemIds = new Set<string>()

  let sortOrder = 0
  for (const card of board.cards) {
    seenCardIds.add(card.id)
    for (const cl of card.checklists ?? []) {
      for (const item of cl.checkItems ?? []) {
        seenCheckItemIds.add(item.id)
      }
    }

    const listName = lists.get(card.idList) ?? ""
    const wipStatus = mapListNameToWipStatus(listName)
    const deliveryDate = dueToDate(card.due)

    const { data: existing } = await supabase
      .from(Tables.line_items)
      .select("id")
      .eq("organization_id", organizationId)
      .eq("trello_card_id", card.id)
      .maybeSingle()

    let lineItemId: string
    if (existing?.id) {
      const { error } = await supabase
        .from(Tables.line_items)
        .update({
          title: card.name,
          description: card.desc || null,
          wip_status: wipStatus,
          delivery_date: deliveryDate,
          sort_order: sortOrder,
          job_id: jobId,
        })
        .eq("id", existing.id)
      if (error) throwOnError({ data: null, error })
      lineItemId = existing.id
    } else {
      const { data: inserted, error } = await supabase
        .from(Tables.line_items)
        .insert({
          organization_id: organizationId,
          job_id: jobId,
          title: card.name,
          description: card.desc || null,
          quantity: 1,
          wip_status: wipStatus,
          delivery_date: deliveryDate,
          sort_order: sortOrder,
          trello_card_id: card.id,
        })
        .select("id")
        .single()
      const row = throwOnError({ data: inserted, error })
      lineItemId = row.id
    }

    cardsUpserted += 1
    tasksUpserted += await upsertTasksForCard({
      organizationId,
      jobId,
      lineItemId,
      card,
    })
    sortOrder += 1
  }

  // Orphan counts (do not delete)
  const { data: crmCards } = await supabase
    .from(Tables.line_items)
    .select("id, trello_card_id")
    .eq("job_id", jobId)
    .not("trello_card_id", "is", null)

  const orphanedLineItems = (crmCards ?? []).filter(
    (r) => r.trello_card_id && !seenCardIds.has(r.trello_card_id)
  ).length

  const { data: crmTasks } = await supabase
    .from(Tables.tasks)
    .select("id, trello_checkitem_id")
    .eq("job_id", jobId)
    .not("trello_checkitem_id", "is", null)

  const orphanedTasks = (crmTasks ?? []).filter(
    (r) => r.trello_checkitem_id && !seenCheckItemIds.has(r.trello_checkitem_id)
  ).length

  return { cardsUpserted, tasksUpserted, orphanedLineItems, orphanedTasks }
}

async function upsertJobFromBoard(
  board: TrelloBoard,
  organizationId: string
): Promise<TrelloCommitResult> {
  const supabase = await createClient()
  const existingMap = await loadExistingByBoardIds(organizationId, [board.id])
  const existing = existingMap.get(board.id)
  const labels = labelNamesFromBoard(board)
  const status = inferBoardStatus(board)
  const template = inferJobTemplate(board.name, labels)
  const notesParts = [
    board.desc?.trim() || null,
    `Imported from Trello: ${board.url}`,
  ].filter(Boolean)

  let jobId: string
  let match: TrelloImportMatch

  if (existing) {
    match = "update"
    jobId = existing.id
    const { error } = await supabase
      .from(Tables.jobs)
      .update({
        description: board.name,
        status,
        job_template: template,
        notes: notesParts.join("\n\n"),
        trello_board_id: board.id,
      })
      .eq("id", jobId)
    if (error) throwOnError({ data: null, error })
  } else {
    match = "new"
    const jobNumber = await ensureUniqueJobNumber(
      deriveJobNumber(board.name, board.id)
    )
    const { data, error } = await supabase
      .from(Tables.jobs)
      .insert({
        organization_id: organizationId,
        account_id: null,
        job_number: jobNumber,
        po_number: "Trello",
        description: board.name,
        status,
        priority: "Normal",
        job_template: template,
        notes: notesParts.join("\n\n"),
        progress: 0,
        value: 0,
        trello_board_id: board.id,
      })
      .select("id")
      .single()
    const row = throwOnError({ data, error })
    jobId = row.id
  }

  const counts = await upsertLineItemsForBoard({
    organizationId,
    jobId,
    board,
  })
  await syncJobProgress(jobId)

  return {
    boardId: board.id,
    jobId,
    match,
    cardsUpserted: counts.cardsUpserted,
    tasksUpserted: counts.tasksUpserted,
    orphanedLineItems: counts.orphanedLineItems,
    orphanedTasks: counts.orphanedTasks,
  }
}

export async function commitTrelloImport(
  boardIds: string[]
): Promise<{ results: TrelloCommitResult[] }> {
  const config = requireTrelloConfig()
  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)

  const uniqueIds = [...new Set(boardIds.map((id) => id.trim()).filter(Boolean))]
  if (uniqueIds.length === 0) {
    throw new Error("Select at least one board to import")
  }

  const results: TrelloCommitResult[] = []
  for (const boardId of uniqueIds) {
    const board = await fetchBoardBundle(boardId, config)
    results.push(await upsertJobFromBoard(board, organizationId))
  }
  return { results }
}

export async function refreshTrelloJobs(): Promise<TrelloRefreshResult> {
  const config = requireTrelloConfig()
  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)

  const { data: jobs, error } = await supabase
    .from(Tables.jobs)
    .select("id, trello_board_id")
    .eq("organization_id", organizationId)
    .not("trello_board_id", "is", null)

  throwOnError({ data: jobs, error })

  let jobsRefreshed = 0
  let cardsUpserted = 0
  let tasksUpserted = 0
  let orphanedLineItems = 0
  let orphanedTasks = 0
  const errors: { boardId: string; message: string }[] = []

  for (const job of jobs ?? []) {
    const boardId = job.trello_board_id
    if (!boardId) continue
    if (config.boardIdsAllowlist && !config.boardIdsAllowlist.includes(boardId)) {
      continue
    }
    try {
      const board = await fetchBoardBundle(boardId, config)
      const result = await upsertJobFromBoard(board, organizationId)
      jobsRefreshed += 1
      cardsUpserted += result.cardsUpserted
      tasksUpserted += result.tasksUpserted
      orphanedLineItems += result.orphanedLineItems
      orphanedTasks += result.orphanedTasks
    } catch (err) {
      errors.push({
        boardId,
        message: err instanceof Error ? err.message : "Refresh failed",
      })
    }
  }

  return {
    jobsRefreshed,
    cardsUpserted,
    tasksUpserted,
    orphanedLineItems,
    orphanedTasks,
    errors,
  }
}
