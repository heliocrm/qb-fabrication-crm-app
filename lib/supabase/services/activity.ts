import { createClient } from "@/lib/supabase/server"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
} from "@/lib/supabase/schema"

export async function insertActivityLog(input: {
  jobId: string
  userId: string | null
  userName: string
  userAvatar?: string | null
  action: string
  metadata?: Record<string, unknown> | null
}): Promise<void> {
  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)

  const { error } = await supabase.from(Tables.activity_logs).insert({
    organization_id: organizationId,
    job_id: input.jobId,
    user_id: input.userId,
    user_name: input.userName,
    user_avatar: input.userAvatar ?? null,
    action: input.action,
    metadata: (input.metadata ?? {}) as import("@/types/database").Json,
  })

  if (error) throwOnError({ data: null, error })
}
