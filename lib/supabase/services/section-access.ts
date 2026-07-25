import { createClient } from "@/lib/supabase/server"
import { Tables, throwOnError } from "@/lib/supabase/schema"
import type { OrganizationRole } from "@/types"

export async function upsertSectionAccess(input: {
  organizationId: string
  sectionKey: string
  role: OrganizationRole
  enabled: boolean
}): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from(Tables.organization_section_access).upsert(
    {
      organization_id: input.organizationId,
      section_key: input.sectionKey,
      role: input.role,
      enabled: input.enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id,section_key,role" }
  )
  if (error) throwOnError({ data: null, error })
}
