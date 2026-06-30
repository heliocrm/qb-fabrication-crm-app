import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
} from "@/lib/supabase/schema"
import { mapProfileSummary } from "@/lib/supabase/services/profiles"
import type { ProfileSummary } from "@/types"

export async function listJobAssignees(jobId: string): Promise<ProfileSummary[]> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.job_assignees)
    .select(
      "profile_id, profiles:profile_id ( id, full_name, role, avatar_initials, is_active )"
    )
    .eq("job_id", jobId)

  throwOnError({ data, error })

  return (
    (data ?? []) as unknown as {
      profiles: {
        id: string
        full_name: string | null
        role: string
        avatar_initials: string | null
        is_active: boolean
      } | null
    }[]
  )
    .map((row) => row.profiles)
    .filter((p): p is NonNullable<typeof p> => p != null && p.is_active)
    .map(mapProfileSummary)
}

export async function setJobAssignees(
  jobId: string,
  profileIds: string[],
  assignedByProfileId?: string
): Promise<ProfileSummary[]> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const uniqueIds = [...new Set(profileIds)]

  const { data: existing, error: listError } = await supabase
    .from(Tables.job_assignees)
    .select("profile_id")
    .eq("job_id", jobId)

  throwOnError({ data: existing, error: listError })

  const currentIds = new Set((existing ?? []).map((r) => r.profile_id))
  const targetIds = new Set(uniqueIds)

  const toRemove = [...currentIds].filter((id) => !targetIds.has(id))
  const toAdd = [...targetIds].filter((id) => !currentIds.has(id))

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from(Tables.job_assignees)
      .delete()
      .eq("job_id", jobId)
      .in("profile_id", toRemove)
    if (error) throwOnError({ data: null, error })
  }

  if (toAdd.length > 0) {
    const { error } = await supabase.from(Tables.job_assignees).insert(
      toAdd.map((profileId) => ({
        job_id: jobId,
        profile_id: profileId,
        assigned_by: assignedByProfileId ?? null,
      }))
    )
    if (error) throwOnError({ data: null, error })
  }

  return listJobAssignees(jobId)
}

export async function addJobAssignees(
  jobId: string,
  profileIds: string[],
  assignedByProfileId?: string
): Promise<void> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const { data: existing } = await supabase
    .from(Tables.job_assignees)
    .select("profile_id")
    .eq("job_id", jobId)

  const currentIds = new Set((existing ?? []).map((r) => r.profile_id))
  const toAdd = profileIds.filter((id) => !currentIds.has(id))

  if (toAdd.length === 0) return

  const { error } = await supabase.from(Tables.job_assignees).insert(
    toAdd.map((profileId) => ({
      job_id: jobId,
      profile_id: profileId,
      assigned_by: assignedByProfileId ?? null,
    }))
  )
  if (error) throwOnError({ data: null, error })
}
