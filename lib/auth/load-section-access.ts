import { createClient } from "@/lib/supabase/server"
import { Tables } from "@/lib/supabase/schema"
import type { SectionAccessMatrix } from "@/lib/auth/section-access"
import type { OrganizationRole } from "@/types"

export async function loadSectionAccessMatrix(
  organizationId: string
): Promise<SectionAccessMatrix> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from(Tables.organization_section_access)
    .select("section_key, role, enabled")
    .eq("organization_id", organizationId)

  if (error || !data) {
    return {}
  }

  const matrix: SectionAccessMatrix = {}
  for (const row of data) {
    const key = row.section_key
    const role = row.role as OrganizationRole
    if (!matrix[key]) matrix[key] = {}
    matrix[key][role] = row.enabled
  }
  return matrix
}
