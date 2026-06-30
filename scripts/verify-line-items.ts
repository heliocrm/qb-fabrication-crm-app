/**
 * Verify line items + template seeding against Supabase.
 * Usage: pnpm tsx scripts/verify-line-items.ts
 */
import { config } from "dotenv"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "../types/database"
import { JOB_TEMPLATES } from "../lib/job-templates"
import { TASK_CATEGORIES } from "../lib/job-detail-config"
import { SEED_JOB_IDS, SEED_ORG_ID } from "../lib/seed-ids"
import type { JobTemplateType } from "../types/enums"

type LineItemRow = { title: string; tasks?: { category: string }[] }

config({ path: resolve(process.cwd(), ".env.local") })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

async function verifyTemplates() {
  console.log("\n=== Template definitions ===")
  for (const key of Object.keys(JOB_TEMPLATES) as JobTemplateType[]) {
    const t = JOB_TEMPLATES[key]
    const cats = new Set(t.checklist.map((i) => i.category))
    const missing = TASK_CATEGORIES.filter((c) => !cats.has(c))
    console.log(
      `  ${key}: ${t.checklist.length} tasks, ${cats.size} categories` +
        (missing.length ? ` — MISSING ${missing.join(", ")}` : " — OK")
    )
    assert(missing.length === 0, `${key} missing categories: ${missing.join(", ")}`)
  }
}

async function verifyExistingJob(jobId: string, label: string) {
  const { data: job, error } = await supabase
    .from("jobs")
    .select(
      `id, job_number, job_template,
       line_items ( id, title, wip_status, tasks ( id, category, completed ) ),
       documents ( id, name, line_item_id )`
    )
    .eq("id", jobId)
    .single()

  if (error) throw error
  assert(Boolean(job), `${label}: job not found`)

  const lineItems =
    (job as unknown as { line_items?: LineItemRow[] }).line_items ?? []
  assert(lineItems.length > 0, `${label}: expected at least one line item`)

  const tasks = lineItems.flatMap((li) => li.tasks ?? [])
  console.log(
    `  ${label} (${job.job_number}): ${lineItems.length} line item(s), ${tasks.length} task(s), template=${job.job_template ?? "null"}`
  )

  for (const li of lineItems) {
    const cats = new Set((li.tasks ?? []).map((t) => t.category))
    console.log(`    - "${li.title}": ${li.tasks?.length ?? 0} tasks, categories: ${[...cats].join(", ")}`)
  }

  const docs = (job as { documents: { name: string; line_item_id: string | null }[] }).documents ?? []
  const jobLevel = docs.filter((d) => !d.line_item_id).length
  const scoped = docs.filter((d) => d.line_item_id).length
  if (docs.length) {
    console.log(`    documents: ${jobLevel} job-level, ${scoped} line-item scoped`)
  }
}

async function createAndVerifyTemplate(template: JobTemplateType) {
  const suffix = Date.now().toString(36)
  const jobNumber = `QB-VERIFY-${template.toUpperCase()}-${suffix}`
  const expected = JOB_TEMPLATES[template].checklist.length

  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .insert({
      organization_id: SEED_ORG_ID,
      job_number: jobNumber,
      po_number: `VERIFY-${suffix}`,
      description: `Verification job for ${template}`,
      job_template: template,
      status: "To Do",
      priority: "Normal",
      progress: 0,
      value: 0,
    })
    .select("id")
    .single()

  if (jobErr) throw jobErr

  const { data: lineItem, error: liErr } = await supabase
    .from("line_items")
    .insert({
      organization_id: SEED_ORG_ID,
      job_id: job.id,
      title: JOB_TEMPLATES[template].defaultLineItemTitle,
      quantity: 1,
      wip_status: "To Do",
      sort_order: 0,
    })
    .select("id")
    .single()

  if (liErr) throw liErr

  const payloads = JOB_TEMPLATES[template].checklist.map((item, index) => ({
    organization_id: SEED_ORG_ID,
    job_id: job.id,
    line_item_id: lineItem.id,
    title: item.title,
    category: item.category,
    completed: false,
    sort_order: index,
  }))

  const { error: taskErr } = await supabase.from("tasks").insert(payloads)
  if (taskErr) throw taskErr

  const { data: loaded, error: loadErr } = await supabase
    .from("tasks")
    .select("id, category")
    .eq("line_item_id", lineItem.id)

  if (loadErr) throw loadErr

  const tasks = loaded ?? []
  assert(tasks.length === expected, `${template}: expected ${expected} tasks, got ${tasks.length}`)

  const cats = new Set(tasks.map((t) => t.category))
  const missing = TASK_CATEGORIES.filter((c) => !cats.has(c))
  assert(
    missing.length === 0,
    `${template}: seeded tasks missing categories: ${missing.join(", ")}`
  )

  console.log(`  ${template}: created job ${jobNumber} with ${tasks.length} tasks across ${cats.size} categories`)

  // Test document scoping
  const { error: docJobErr } = await supabase.from("documents").insert({
    organization_id: SEED_ORG_ID,
    job_id: job.id,
    name: "job-level-test.pdf",
    type: "PO",
    line_item_id: null,
  })
  if (docJobErr) throw docJobErr

  const { error: docLiErr } = await supabase.from("documents").insert({
    organization_id: SEED_ORG_ID,
    job_id: job.id,
    name: "line-item-test.pdf",
    type: "Drawing",
    line_item_id: lineItem.id,
  })
  if (docLiErr) throw docLiErr

  const { data: docs } = await supabase
    .from("documents")
    .select("line_item_id")
    .eq("job_id", job.id)

  const jobLevel = docs?.filter((d) => !d.line_item_id).length ?? 0
  const liScoped = docs?.filter((d) => d.line_item_id === lineItem.id).length ?? 0
  assert(jobLevel === 1 && liScoped === 1, `${template}: document scoping failed`)

  // Cleanup verification jobs
  await supabase.from("jobs").delete().eq("id", job.id)

  console.log(`  ${template}: document scoping OK, cleaned up`)
}

async function main() {
  console.log("Verifying line items + templates against Supabase…")
  await verifyTemplates()

  console.log("\n=== Existing seeded jobs ===")
  await verifyExistingJob(SEED_JOB_IDS.j1, "BPA crossarm (j1)")
  await verifyExistingJob(SEED_JOB_IDS.j4, "BPA plates (j4)")

  console.log("\n=== Create job from each template ===")
  for (const template of Object.keys(JOB_TEMPLATES) as JobTemplateType[]) {
    await createAndVerifyTemplate(template)
  }

  console.log("\n✓ All verification checks passed\n")
}

main().catch((err) => {
  console.error("\n✗ Verification failed:", err.message ?? err)
  process.exit(1)
})
