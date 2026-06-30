/**
 * Verify role-based access and job_assignees against Supabase.
 * Usage: pnpm verify:roles
 */
import { config } from "dotenv"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "../types/database"
import { SEED_JOB_IDS, SEED_ORG_ID } from "../lib/seed-ids"

config({ path: resolve(process.cwd(), ".env.local") })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const admin = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

async function main() {
  console.log("Verifying roles + job_assignees…\n")

  const { count: assigneeCount, error: countErr } = await admin
    .from("job_assignees")
    .select("*", { count: "exact", head: true })
    .eq("job_id", SEED_JOB_IDS.j1)

  if (countErr) throw countErr
  console.log(`  Job j1 job_assignees rows: ${assigneeCount ?? 0}`)

  const { data: profiles, error: profErr } = await admin
    .from("profiles")
    .select("id, role, is_active, full_name")
    .eq("organization_id", SEED_ORG_ID)

  if (profErr) throw profErr
  assert((profiles?.length ?? 0) > 0, "Expected at least one profile in org")

  const adminCount = profiles?.filter((p) => p.role === "admin" && p.is_active).length ?? 0
  assert(adminCount >= 1, "Expected at least one active admin profile")
  console.log(`  Profiles: ${profiles?.length}, active admins: ${adminCount}`)

  const { data: jobs, error: jobsErr } = await admin
    .from("jobs")
    .select("id, job_number")
    .eq("organization_id", SEED_ORG_ID)

  if (jobsErr) throw jobsErr
  console.log(`  Total seed jobs: ${jobs?.length ?? 0}`)

  console.log("\n✓ Role migration checks passed (RLS behavior requires per-user JWT tests)")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
