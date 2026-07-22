import { createClient } from "@/lib/supabase/server"
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin"
import {
  Tables,
  requireOrganizationId,
  throwOnError,
} from "@/lib/supabase/schema"
import type { PushSubscriptionInsert, PushSubscriptionRow } from "@/types"

export async function savePushSubscription(input: {
  endpoint: string
  p256dh: string
  auth: string
  userAgent?: string | null
  profileId: string
}): Promise<PushSubscriptionRow> {
  const supabase = await createClient()
  const organizationId = await requireOrganizationId(supabase)

  const payload: PushSubscriptionInsert = {
    organization_id: organizationId,
    profile_id: input.profileId,
    endpoint: input.endpoint,
    p256dh: input.p256dh,
    auth: input.auth,
    user_agent: input.userAgent ?? null,
  }

  const { data, error } = await supabase
    .from(Tables.push_subscriptions)
    .upsert(payload, { onConflict: "endpoint" })
    .select("*")
    .single()

  return throwOnError({ data, error }) as PushSubscriptionRow
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const { error } = await supabase
    .from(Tables.push_subscriptions)
    .delete()
    .eq("endpoint", endpoint)

  if (error) {
    throwOnError({ data: null, error })
  }
}

export async function listPushSubscriptionsForProfiles(
  profileIds: string[]
): Promise<PushSubscriptionRow[]> {
  if (profileIds.length === 0) return []

  if (!isAdminClientConfigured()) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from(Tables.push_subscriptions)
      .select("*")
      .in("profile_id", profileIds)
    if (error) return []
    return (data ?? []) as PushSubscriptionRow[]
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from(Tables.push_subscriptions)
    .select("*")
    .in("profile_id", profileIds)

  if (error) return []
  return (data ?? []) as PushSubscriptionRow[]
}

export async function deletePushSubscriptionById(id: string): Promise<void> {
  if (!isAdminClientConfigured()) return
  const admin = createAdminClient()
  await admin.from(Tables.push_subscriptions).delete().eq("id", id)
}
