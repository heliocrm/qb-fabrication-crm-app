/**
 * Generates supabase/migrations/004_seed_data.sql from mock data.
 * Run: pnpm tsx scripts/generate-seed-sql.ts
 */
import { writeFileSync } from "fs"
import { resolve } from "path"
import { accounts, jobs, opportunities } from "../lib/mock-data"
import { SEED_ORG_ID, SEED_ACCOUNT_IDS, SEED_JOB_IDS } from "../lib/seed-ids"

function esc(s: string): string {
  return s.replace(/'/g, "''")
}

function seedUuid(prefix: string, n: number): string {
  return `${prefix}-0000-4000-8000-${String(n).padStart(12, "0")}`
}

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

const lines: string[] = [
  "-- QB Fabrication CRM — migration 004",
  "-- Demo seed data (accounts, opportunities, jobs, line items, tasks, documents, etc.)",
  "-- Run in Supabase SQL Editor AFTER 003",
  "",
  `insert into public.organizations (id, name, slug)`,
  `values ('${SEED_ORG_ID}', 'QB Fabrication', 'qb-fabrication')`,
  `on conflict (slug) do update set name = excluded.name;`,
  "",
]

lines.push("-- Accounts")
for (const a of accounts) {
  const id = SEED_ACCOUNT_IDS[a.id as keyof typeof SEED_ACCOUNT_IDS]
  lines.push(
    `insert into public.accounts (id, organization_id, name, short_name, contact, email, phone, city, state, status) values ('${id}', '${SEED_ORG_ID}', '${esc(a.name)}', '${esc(a.shortName)}', '${esc(a.contact)}', '${esc(a.email)}', '${esc(a.phone)}', '${esc(a.city)}', '${esc(a.state)}', '${a.status}') on conflict (id) do nothing;`
  )
}

lines.push("", "-- Opportunities")
opportunities.forEach((o, i) => {
  const id = seedUuid("a0000000", 300 + i + 1)
  const accountId = SEED_ACCOUNT_IDS[o.customerId as keyof typeof SEED_ACCOUNT_IDS]
  lines.push(
    `insert into public.opportunities (id, organization_id, account_id, title, value, stage, probability, close_date, assignee, notes) values ('${id}', '${SEED_ORG_ID}', '${accountId}', '${esc(o.title)}', ${o.value}, '${o.stage}', ${o.probability}, '${o.closeDate}', '${esc(o.assignee)}', '${esc(o.notes)}') on conflict (id) do nothing;`
  )
})

lines.push("", "-- Jobs")
for (const j of jobs) {
  const id = SEED_JOB_IDS[j.id as keyof typeof SEED_JOB_IDS]
  const accountId = SEED_ACCOUNT_IDS[j.customerId as keyof typeof SEED_ACCOUNT_IDS]
  const marks = `{${j.markNumbers.map((m) => `"${esc(m)}"`).join(",")}}`
  const assignees = `{${(j.assignees ?? []).map((a) => `"${esc(a)}"`).join(",")}}`
  lines.push(
    `insert into public.jobs (id, organization_id, account_id, job_number, po_number, description, status, priority, delivery_date, start_date, tonnage, value, mark_numbers, assignees, progress, notes, google_drive_folder_id) values ('${id}', '${SEED_ORG_ID}', '${accountId}', '${esc(j.jobNumber)}', '${esc(j.poNumber)}', '${esc(j.description)}', '${j.status}', '${j.priority}', '${j.deliveryDate}', '${j.startDate}', ${j.tonnage}, ${j.value}, '${marks}', '${assignees}', ${j.progress}, ${j.notes ? `'${esc(j.notes)}'` : "null"}, 'mock-folder-${j.jobNumber.replace(/-/g, "")}') on conflict (id) do nothing;`
  )
}

lines.push("", "-- Tasks (line_item_id backfilled in migration 005)")
let taskN = 0
for (const j of jobs) {
  const jobId = SEED_JOB_IDS[j.id as keyof typeof SEED_JOB_IDS]
  j.tasks.forEach((t, ti) => {
    taskN++
    lines.push(
      `insert into public.tasks (id, organization_id, job_id, title, completed, assignee, due_date, category, sort_order) values ('${seedUuid("b0000000", taskN)}', '${SEED_ORG_ID}', '${jobId}', '${esc(t.title)}', ${t.completed}, '${esc(t.assignee)}', '${t.dueDate}', '${t.category}', ${ti}) on conflict (id) do nothing;`
    )
  })
}

lines.push("", "-- Documents")
let docN = 0
for (const j of jobs) {
  const jobId = SEED_JOB_IDS[j.id as keyof typeof SEED_JOB_IDS]
  for (const d of j.documents) {
    docN++
    const sizeBytes = parseSizeBytes(d.size)
    lines.push(
      `insert into public.documents (id, organization_id, job_id, name, type, mime_type, size_bytes, google_drive_file_id, google_drive_folder_id, web_view_link, preview_enabled, uploaded_by) values ('${seedUuid("c0000000", docN)}', '${SEED_ORG_ID}', '${jobId}', '${esc(d.name)}', '${d.type}', ${d.name.endsWith(".pdf") ? "'application/pdf'" : "null"}, ${sizeBytes ?? "null"}, 'mock-file-${docN}', 'mock-folder-${j.jobNumber.replace(/-/g, "")}', ${d.url ? `'${esc(d.url)}'` : "null"}, ${d.preview ?? false}, '${esc(d.uploadedBy)}') on conflict (id) do nothing;`
    )
  }
}

lines.push("", "-- Change orders")
let coN = 0
for (const j of jobs) {
  const jobId = SEED_JOB_IDS[j.id as keyof typeof SEED_JOB_IDS]
  for (const co of j.changeOrders) {
    coN++
    lines.push(
      `insert into public.change_orders (id, organization_id, job_id, type, description, impact, status, occurred_on, value) values ('${seedUuid("d0000000", coN)}', '${SEED_ORG_ID}', '${jobId}', '${co.type}', '${esc(co.description)}', '${esc(co.impact)}', '${co.status}', '${co.date}', ${co.value ?? "null"}) on conflict (id) do nothing;`
    )
  }
}

lines.push("", "-- Activity logs")
let actN = 0
for (const j of jobs) {
  const jobId = SEED_JOB_IDS[j.id as keyof typeof SEED_JOB_IDS]
  for (const a of j.activity) {
    actN++
    const ts = new Date(a.timestamp.replace(" ", "T")).toISOString()
    lines.push(
      `insert into public.activity_logs (id, organization_id, job_id, user_name, user_avatar, action, created_at) values ('${seedUuid("e0000000", actN)}', '${SEED_ORG_ID}', '${jobId}', '${esc(a.user)}', '${esc(a.avatar)}', '${esc(a.action)}', '${ts}') on conflict (id) do nothing;`
    )
  }
}

const outPath = resolve(process.cwd(), "supabase/migrations/004_seed_data.sql")
writeFileSync(outPath, lines.join("\n") + "\n")
console.log(`Wrote ${outPath} (${lines.length} lines)`)
