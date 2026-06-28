import { createClient } from "@/lib/supabase/server"
import { Tables, requireOrganizationId, throwOnError } from "@/lib/supabase/schema"
import { mapAccountRow } from "@/lib/supabase/mappers"
import type { Account, AccountRow } from "@/types"

export async function listAccounts(): Promise<Account[]> {
  const supabase = await createClient()
  await requireOrganizationId(supabase)

  const { data, error } = await supabase
    .from(Tables.accounts)
    .select("*")
    .order("name", { ascending: true })

  throwOnError({ data, error })

  return ((data ?? []) as AccountRow[]).map(mapAccountRow)
}
