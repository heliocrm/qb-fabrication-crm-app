# Supabase schema

Run migrations in order in the [SQL Editor](https://supabase.com/dashboard/project/wkutsmgonkawgbidinwx/sql):

1. `001_initial_schema.sql` — base tables
2. `002_multi_tenant_and_indexes.sql` — organizations, RLS, indexes, Google Drive fields
3. `003_provision_and_backfill.sql` — QB Fabrication org seed, backfill, auto-provision RPC
4. `004_seed_data.sql` — demo accounts, jobs, tasks, documents (optional but recommended)
5. `005_line_items_and_templates.sql` — line items, job templates, task categories, backfill
6. `006_fix_document_scoping.sql` — correct job-level vs line-item document scoping on seed jobs
7. `007_user_roles_and_assignees.sql` — roles, `job_assignees`, RLS helpers, admin bootstrap
8. `008_profile_and_report_views.sql` — avatar_url, notification prefs, report_views, avatars bucket
9. `009_report_views_user_isolation.sql` — force RLS + unique view names per user
10. `010_material_pull_requests.sql` — material pull funnel
11. `011_material_pull_hierarchy.sql` — approved status, location, pull_notes / pull_checklist

## Seed demo data

**Option A — SQL Editor (no local keys needed):**

Run `004_seed_data.sql` in the [SQL Editor](https://supabase.com/dashboard/project/wkutsmgonkawgbidinwx/sql) after migration 003.

**Option B — local script:**

Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`, then:

```bash
pnpm install
pnpm seed
```

This upserts the QB Fabrication org, accounts, jobs, tasks, documents, change orders, and activity logs from the mock data.

## Profile auto-provisioning

You no longer need to manually insert a profile row. On first sign-in, the app calls `provision_user_profile()` which links your auth user to the QB Fabrication org automatically.

## RLS model

All tenant tables scope access via `organization_id = current_organization_id()`.
Users only see data belonging to their company. Service role bypasses RLS for admin scripts.

## TypeScript usage

```typescript
// Server Component — tries Supabase, falls back to mock
import { loadJobs, loadJobById } from "@/lib/data/jobs"

// Server Action (mutations + revalidation)
import { updateJobAction, toggleTaskAction } from "@/lib/actions/jobs"
```

Domain types live in `types/` (camelCase). DB rows use snake_case mappers in `lib/supabase/mappers.ts`.

## Example job URL after seed

`/jobs/a0000000-0000-4000-8000-000000000201` (BPA PO 90866)
