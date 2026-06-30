import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export type TypedSupabaseClient = SupabaseClient<Database>

export class SupabaseServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: string
  ) {
    super(message)
    this.name = "SupabaseServiceError"
  }
}

export function throwOnError<T>(
  result: {
    data: T | null
    error: { message: string; code?: string; details?: string } | null
  }
): T {
  if (result.error) {
    throw new SupabaseServiceError(
      result.error.message,
      result.error.code,
      result.error.details
    )
  }
  if (result.data == null) {
    throw new SupabaseServiceError("No data returned")
  }
  return result.data
}

/** Table name constants — single source of truth */
export const Tables = {
  organizations: "organizations",
  profiles: "profiles",
  accounts: "accounts",
  opportunities: "opportunities",
  jobs: "jobs",
  line_items: "line_items",
  tasks: "tasks",
  documents: "documents",
  change_orders: "change_orders",
  activity_logs: "activity_logs",
  job_assignees: "job_assignees",
} as const

const JOB_ASSIGNEES_SELECT = `
  job_assignees (
    profile_id,
    profiles:profile_id (
      id,
      full_name,
      role,
      avatar_initials,
      is_active
    )
  )
` as const

/** Job detail select — loads all relations in one query */
export const JOB_WITH_RELATIONS_SELECT = `
  *,
  accounts:account_id ( id, name, short_name ),
  line_items ( *, tasks ( * ) ),
  documents ( * ),
  change_orders ( * ),
  activity_logs ( * ),
  ${JOB_ASSIGNEES_SELECT}
` as const

/** List view select — join account name only */
export const JOB_LIST_SELECT = `
  *,
  accounts:account_id ( id, name, short_name ),
  ${JOB_ASSIGNEES_SELECT}
` as const

/** Opportunity list select — join account for customer name */
export const OPPORTUNITY_LIST_SELECT = `
  *,
  accounts:account_id ( id, name, short_name )
` as const

export async function getCurrentOrganizationId(
  supabase: TypedSupabaseClient
): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from(Tables.profiles)
    .select("organization_id")
    .eq("user_id", user.id)
    .single()

  if (error || !data) return null
  return data.organization_id
}

export async function requireOrganizationId(
  supabase: TypedSupabaseClient
): Promise<string> {
  const orgId = await getCurrentOrganizationId(supabase)
  if (!orgId) {
    throw new SupabaseServiceError(
      "No organization found for the current user. Complete profile setup first."
    )
  }
  return orgId
}
