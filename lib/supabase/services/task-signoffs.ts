import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { verifyFloorPin } from "@/lib/floor-pin"
import {
  FLOOR_NOTE_MAX_CHARS,
  isFloorSignoffReasonCode,
  isFloorTaskCategory,
  type FloorSignoffReasonCode,
} from "@/lib/floor-signoff-reasons"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
  SupabaseServiceError,
} from "@/lib/supabase/schema"
import { insertActivityLog } from "@/lib/supabase/services/activity"
import { syncJobProgress } from "@/lib/supabase/services/jobs"
import type { TaskSignoff, TaskSignoffRow } from "@/types"

function mapSignoff(
  row: TaskSignoffRow,
  signedByName: string | null = null
): TaskSignoff {
  return {
    id: row.id,
    organizationId: row.organization_id,
    jobId: row.job_id,
    lineItemId: row.line_item_id,
    taskId: row.task_id,
    travelerLineId: row.traveler_line_id,
    signedBy: row.signed_by,
    signedByName,
    sessionProfileId: row.session_profile_id,
    reasonCodes: (row.reason_codes ?? []).filter(isFloorSignoffReasonCode),
    note: row.note,
    signedAt: row.signed_at,
  }
}

export async function listLatestSignoffsForJob(
  jobId: string
): Promise<Record<string, TaskSignoff>> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.task_signoffs)
    .select("*, signer:signed_by ( full_name, avatar_initials )")
    .eq("job_id", jobId)
    .order("signed_at", { ascending: false })

  throwOnError({ data, error })

  const latest: Record<string, TaskSignoff> = {}
  for (const raw of data ?? []) {
    const row = raw as TaskSignoffRow & {
      signer?: { full_name: string | null; avatar_initials: string | null } | null
    }
    if (latest[row.task_id]) continue
    latest[row.task_id] = mapSignoff(row, row.signer?.full_name ?? null)
  }
  return latest
}

export async function listLatestSignoffsForLineItem(
  lineItemId: string
): Promise<Record<string, TaskSignoff>> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.task_signoffs)
    .select("*, signer:signed_by ( full_name )")
    .eq("line_item_id", lineItemId)
    .order("signed_at", { ascending: false })

  throwOnError({ data, error })

  const latest: Record<string, TaskSignoff> = {}
  for (const raw of data ?? []) {
    const row = raw as TaskSignoffRow & {
      signer?: { full_name: string | null } | null
    }
    if (latest[row.task_id]) continue
    latest[row.task_id] = mapSignoff(row, row.signer?.full_name ?? null)
  }
  return latest
}

export async function signOffFloorTask(input: {
  taskId: string
  workerProfileId: string
  sessionProfileId: string
  pin: string
  reasonCodes: string[]
  note?: string | null
  travelerLineId?: string | null
}): Promise<TaskSignoff> {
  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)

  const reasons = input.reasonCodes.filter(isFloorSignoffReasonCode)
  if (!reasons.length) {
    throw new SupabaseServiceError("Pick at least one reason.")
  }
  if (reasons.includes("partial_qty") && !input.note?.trim()) {
    throw new SupabaseServiceError("Partial qty requires a short note.")
  }
  const note = input.note?.trim() || null
  if (note && note.length > FLOOR_NOTE_MAX_CHARS) {
    throw new SupabaseServiceError(
      `Note must be ${FLOOR_NOTE_MAX_CHARS} characters or fewer.`
    )
  }

  const { data: taskData, error: taskError } = await supabase
    .from(Tables.tasks)
    .select("id, job_id, line_item_id, title, category, completed")
    .eq("id", input.taskId)
    .single()

  const task = throwOnError({ data: taskData, error: taskError })

  if (!isFloorTaskCategory(task.category)) {
    throw new SupabaseServiceError(
      "Only Machine, Fabrication, QA, and Shipping steps can be signed on the floor."
    )
  }

  const admin = createAdminClient()
  const { data: worker, error: workerError } = await admin
    .from(Tables.profiles)
    .select(
      "id, user_id, full_name, avatar_initials, is_active, organization_id, is_station_account"
    )
    .eq("id", input.workerProfileId)
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (workerError) throwOnError({ data: null, error: workerError })
  if (!worker || !worker.is_active) {
    throw new SupabaseServiceError("Worker not found or inactive.")
  }
  if (worker.is_station_account) {
    throw new SupabaseServiceError(
      "Station accounts cannot be the signing worker. Pick a person."
    )
  }

  const { data: pinRow, error: pinError } = await admin
    .from(Tables.profile_floor_pins)
    .select("pin_hash")
    .eq("profile_id", worker.id)
    .maybeSingle()
  if (pinError) throwOnError({ data: null, error: pinError })
  if (!verifyFloorPin(input.pin, pinRow?.pin_hash)) {
    throw new SupabaseServiceError("Incorrect PIN.")
  }

  let catalogHint = ""
  if (input.travelerLineId) {
    const { data: tLine } = await supabase
      .from(Tables.traveler_lines)
      .select("catalog_id, structure_number")
      .eq("id", input.travelerLineId)
      .maybeSingle()
    if (tLine) {
      catalogHint = ` on ${tLine.catalog_id}${
        tLine.structure_number ? ` (${tLine.structure_number})` : ""
      }`
    }
  } else {
    const { data: lineItem } = await supabase
      .from(Tables.line_items)
      .select("title, line_item_number")
      .eq("id", task.line_item_id)
      .maybeSingle()
    if (lineItem) {
      catalogHint = ` on ${lineItem.line_item_number ?? lineItem.title}`
    }
  }

  const { data: signoff, error: signError } = await supabase
    .from(Tables.task_signoffs)
    .insert({
      organization_id: organizationId,
      job_id: task.job_id,
      line_item_id: task.line_item_id,
      task_id: task.id,
      traveler_line_id: input.travelerLineId ?? null,
      signed_by: worker.id,
      session_profile_id: input.sessionProfileId,
      reason_codes: reasons,
      note,
    })
    .select("*")
    .single()

  throwOnError({ data: signoff, error: signError })

  const { error: completeError } = await supabase
    .from(Tables.tasks)
    .update({ completed: true })
    .eq("id", task.id)

  if (completeError) throwOnError({ data: null, error: completeError })
  await syncJobProgress(task.job_id)

  const workerName = worker.full_name ?? "Worker"
  await insertActivityLog({
    jobId: task.job_id,
    userId: worker.user_id,
    userName: workerName,
    userAvatar: worker.avatar_initials,
    action: `signed off ${task.title}${catalogHint}`,
    metadata: {
      taskId: task.id,
      lineItemId: task.line_item_id,
      travelerLineId: input.travelerLineId ?? null,
      reasonCodes: reasons,
      note,
      sessionProfileId: input.sessionProfileId,
    },
  })

  return mapSignoff(signoff as TaskSignoffRow, workerName)
}
