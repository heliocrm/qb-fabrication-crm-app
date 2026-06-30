/**
 * Seed Supabase with mock CRM data.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (never commit this key).
 *
 * Usage: pnpm seed
 */
import { config } from "dotenv"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "../types/database"
import { accounts, jobs, opportunities } from "../lib/mock-data"
import { SEED_ORG_ID, SEED_ACCOUNT_IDS, SEED_JOB_IDS } from "../lib/seed-ids"

config({ path: resolve(process.cwd(), ".env.local") })

function parseSizeBytes(size?: string): number | null {
  if (!size) return null
  const match = size.match(/^([\d.]+)\s*(MB|KB|GB)?$/i)
  if (!match) return null
  const n = parseFloat(match[1])
  const unit = (match[2] ?? "B").toUpperCase()
  if (unit === "GB") return Math.round(n * 1024 * 1024 * 1024)
  if (unit === "MB") return Math.round(n * 1024 * 1024)
  if (unit === "KB") return Math.round(n * 1024)
  return Math.round(n)
}

function seedUuid(prefix: string, n: number): string {
  return `${prefix}-0000-4000-8000-${String(n).padStart(12, "0")}`
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error(
      "\nMissing env vars in .env.local:\n" +
        "  NEXT_PUBLIC_SUPABASE_URL\n" +
        "  SUPABASE_SERVICE_ROLE_KEY  ← Supabase Dashboard → Settings → API → service_role\n"
    )
    process.exit(1)
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  console.log("→ Organization...")
  const { error: orgError } = await supabase.from("organizations").upsert(
    { id: SEED_ORG_ID, name: "QB Fabrication", slug: "qb-fabrication" },
    { onConflict: "id" }
  )
  if (orgError) throw orgError

  console.log("→ Accounts...")
  const { error: accError } = await supabase.from("accounts").upsert(
    accounts.map((a) => ({
      id: SEED_ACCOUNT_IDS[a.id as keyof typeof SEED_ACCOUNT_IDS],
      organization_id: SEED_ORG_ID,
      name: a.name,
      short_name: a.shortName,
      contact: a.contact,
      email: a.email,
      phone: a.phone,
      city: a.city,
      state: a.state,
      status: a.status,
    }))
  )
  if (accError) throw accError

  console.log("→ Opportunities...")
  const { error: oppError } = await supabase.from("opportunities").upsert(
    opportunities.map((o, i) => ({
      id: seedUuid("a0000000", 300 + i + 1),
      organization_id: SEED_ORG_ID,
      account_id: SEED_ACCOUNT_IDS[o.customerId as keyof typeof SEED_ACCOUNT_IDS],
      title: o.title,
      value: o.value,
      stage: o.stage,
      probability: o.probability,
      close_date: o.closeDate,
      assignee: o.assignee,
      notes: o.notes,
    }))
  )
  if (oppError) throw oppError

  console.log("→ Jobs...")
  const { error: jobError } = await supabase.from("jobs").upsert(
    jobs.map((j) => ({
      id: SEED_JOB_IDS[j.id as keyof typeof SEED_JOB_IDS],
      organization_id: SEED_ORG_ID,
      account_id: SEED_ACCOUNT_IDS[j.customerId as keyof typeof SEED_ACCOUNT_IDS],
      job_number: j.jobNumber,
      po_number: j.poNumber,
      description: j.description,
      status: j.status,
      priority: j.priority,
      delivery_date: j.deliveryDate,
      start_date: j.startDate,
      tonnage: j.tonnage,
      value: j.value,
      mark_numbers: j.markNumbers,
      assignees: j.assignees,
      progress: j.progress,
      notes: j.notes,
      job_template: j.jobTemplate ?? null,
      google_drive_folder_id: `mock-folder-${j.jobNumber.replace(/-/g, "")}`,
    }))
  )
  if (jobError) throw jobError

  console.log("→ Line items...")
  if (jobs.some((j) => j.lineItems.length > 0)) {
    const { error: liError } = await supabase.from("line_items").upsert(
      jobs.flatMap((j, ji) =>
        j.lineItems.map((li, lii) => ({
          id: seedUuid("f0000000", ji * 10 + lii + 1),
          organization_id: SEED_ORG_ID,
          job_id: SEED_JOB_IDS[j.id as keyof typeof SEED_JOB_IDS],
          title: li.title,
          quantity: li.quantity,
          line_item_number: li.lineItemNumber ?? null,
          wip_status: li.wipStatus,
          sort_order: li.sortOrder ?? 0,
          delivery_date: li.deliveryDate ?? null,
        }))
      )
    )
    if (liError) throw liError
  }

  console.log("→ Tasks...")
  let taskN = 0
  const taskRows = jobs.flatMap((j, ji) =>
    j.lineItems.flatMap((li, lii) =>
      li.tasks.map((t, ti) => {
        taskN++
        return {
          id: seedUuid("b0000000", taskN),
          organization_id: SEED_ORG_ID,
          job_id: SEED_JOB_IDS[j.id as keyof typeof SEED_JOB_IDS],
          line_item_id: seedUuid("f0000000", ji * 10 + lii + 1),
          title: t.title,
          completed: t.completed,
          assignee: t.assignee,
          due_date: t.dueDate,
          category: t.category,
          sort_order: ti,
        }
      })
    )
  )
  if (taskRows.length) {
    const { error: taskError } = await supabase.from("tasks").upsert(taskRows)
    if (taskError) throw taskError
  }

  console.log("→ Documents...")
  let docN = 0
  const docRows = jobs.flatMap((j, ji) =>
    j.documents.map((d) => {
      docN++
      const lineItemIndex = d.lineItemId
        ? j.lineItems.findIndex((li) => li.id === d.lineItemId)
        : -1
      return {
        id: seedUuid("c0000000", docN),
        organization_id: SEED_ORG_ID,
        job_id: SEED_JOB_IDS[j.id as keyof typeof SEED_JOB_IDS],
        line_item_id:
          lineItemIndex >= 0 ? seedUuid("f0000000", ji * 10 + lineItemIndex + 1) : null,
        name: d.name,
        type: d.type,
        mime_type: d.name.endsWith(".pdf") ? "application/pdf" : null,
        size_bytes: parseSizeBytes(d.size),
        google_drive_file_id: `mock-file-${docN}`,
        google_drive_folder_id: `mock-folder-${j.jobNumber.replace(/-/g, "")}`,
        web_view_link: d.url,
        preview_enabled: d.preview ?? false,
        uploaded_by: d.uploadedBy,
      }
    })
  )
  if (docRows.length) {
    const { error: docError } = await supabase.from("documents").upsert(docRows)
    if (docError) throw docError
  }

  console.log("→ Change orders...")
  let coN = 0
  const coRows = jobs.flatMap((j) =>
    j.changeOrders.map((co) => {
      coN++
      return {
        id: seedUuid("d0000000", coN),
        organization_id: SEED_ORG_ID,
        job_id: SEED_JOB_IDS[j.id as keyof typeof SEED_JOB_IDS],
        type: co.type,
        description: co.description,
        impact: co.impact,
        status: co.status,
        occurred_on: co.date,
        value: co.value ?? null,
      }
    })
  )
  if (coRows.length) {
    const { error: coError } = await supabase.from("change_orders").upsert(coRows)
    if (coError) throw coError
  }

  console.log("→ Activity logs...")
  let actN = 0
  const actRows = jobs.flatMap((j) =>
    j.activity.map((a) => {
      actN++
      return {
        id: seedUuid("e0000000", actN),
        organization_id: SEED_ORG_ID,
        job_id: SEED_JOB_IDS[j.id as keyof typeof SEED_JOB_IDS],
        user_name: a.user,
        user_avatar: a.avatar,
        action: a.action,
        created_at: new Date(a.timestamp.replace(" ", "T")).toISOString(),
      }
    })
  )
  if (actRows.length) {
    const { error: actError } = await supabase.from("activity_logs").upsert(actRows)
    if (actError) throw actError
  }

  console.log("\n✓ Seed complete!")
  console.log("  Example job URL: /jobs/" + SEED_JOB_IDS.j1)
  console.log("  Sign in — your profile is auto-created on first visit.\n")
}

main().catch((err) => {
  console.error("Seed failed:", err.message ?? err)
  process.exit(1)
})
