# Material Pull - soft-launch checklist

## Standalone deploy (no CRM for the floor team)

Use a **second Vercel project** from the same GitHub repo + domain `pull.qbfab.com` (or similar).

| Env on pull project | Value |
|---------------------|--------|
| `NEXT_PUBLIC_APP_MODE` | `pull` |
| `NEXT_PUBLIC_SITE_URL` | `https://pull.qbfab.com` |
| Supabase / Resend / VAPID | Same as CRM project |

Also add Supabase Auth redirect URLs for the pull domain (`/auth/callback`, `/auth/reset-password`, `/**`).

With `NEXT_PUBLIC_APP_MODE=pull`:
- Login lands on `/pull` (Material Pull branding)
- Middleware blocks CRM routes (`/jobs`, `/`, etc.) → `/pull`
- "Full CRM" link is hidden

Share only `https://pull.qbfab.com` with the floor team. Keep `crmv1.qbfab.com` for internal CRM use.

Local test: set `NEXT_PUBLIC_APP_MODE=pull` in `.env.local` and restart `pnpm dev`.

## Capability matrix (Admin → Edit user)

Use `manager` / `member` roles plus **Material Pull capabilities** overlays (not new OrganizationRoles).

| Seat | Role | Capabilities |
|------|------|--------------|
| Dylan | `admin` | Full access (all caps implied) |
| Eric | `manager` | `can_approve` (+ `can_request` if needed) |
| Tristen | `manager` | `can_batch` |
| Shane | `manager` | `can_approve_allocation` (+ `can_approve` if he also covers Eric) |
| Floor requestors (Mr. Kung, incoming hire) | `member` | `can_request` only |
| Read-only | `viewer` | Board only (no caps) |

Funnel: **Submission → Approval → Batch & Pull**

- Batch accepts **approved** only (not pending).
- Borrow / steal reason requires **PM allocation** approval (`can_approve_allocation`).
- Soft launch: prefer a job Tristen has already 100% pulled and Eric verified, then route sticky notes through the app.

## Before testers start

- [ ] Run migration `010_material_pull_requests.sql` in Supabase SQL Editor
- [ ] Run migration `011_material_pull_hierarchy.sql` (approved status, location, pull checklist columns)
- [ ] Run migration `013_material_pull_meeting_prep.sql` (priority, reason, source job, profile capabilities)
- [ ] In Admin → Edit user, set seat capabilities per matrix above (migration backfills managers with approve+batch; tune Tristen/Eric/Shane)
- [ ] Confirm seed rows appear (or create a test request)
- [ ] Deploy pull Vercel project with `NEXT_PUBLIC_APP_MODE=pull`
- [ ] Set VAPID env vars for Web Push (optional but recommended)
- [ ] Confirm Resend is configured for email fallback

## Install on phone / tablet

- **Android / Chrome:** open `https://pull.qbfab.com` → Install banner or browser menu → Install app
- **iPhone / iPad:** Safari → Share → **Add to Home Screen** (banner on `/pull` explains this)
- Manifest allows any orientation; shell widens on tablet (`md`/`lg` breakpoints)

## Tester flows

1. **Requester** (`can_request`) - `/pull` → New → Job #, material, qty, **needed-by (required)**, **priority**, **reason** (scrap / nest wrong / short staged / rush / other — not “borrow”), location, notes. If borrowing, check **Borrowing from another job** and enter **Borrow from job #** (required). Borrow is a flag (`source_job_number`), not a reason code.
2. **Approver** (`can_approve`) - Requests board or detail → Approve pending (non-borrow).
3. **PM** (`can_approve_allocation`) - Approve borrow / "Needs PM" items (any request with a source job #, plus legacy rows that still have `reason_code = borrow`).
4. **Handler** (`can_batch`) - Batch → select **approved** only → Create pull list → Print → checklist + canned note → Mark pulled. Queue sorts hot first, then need-by.
5. **Hot notifications** - Submit priority Hot; approvers + allocation approvers get the alert (push/email).
6. **Detail / edit** - Open a pending request → Edit fields → Save.

Requestors without `can_batch` do not see the Batch tab (redirected if they open `/pull/batch`).

## Success criteria

- Installable PWA opens to `/pull`
- Same data in CRM **Material Requests** nav
- Priority / reason / borrow source visible on list, detail, and print sheet
- Approve-before-batch enforced
- Data persists across refresh / devices (Supabase)
- Status events notify via push or email fallback (opted-in profiles)

## Material catalog (searchable picker)

The Material field on `/pull/new` and CRM `/material-requests/new` uses a static catalog generated from the Procurement Status Log CSV.

1. Re-export / update  
   `data/docs/PROCUREMENT STATUS LOG.xlsx - MATERIAL LIST FOR PROJECTS.csv`
2. Regenerate: `pnpm catalog:materials`
3. Commit the updated `data/material-catalog.json`

## Borrow vs reason

**Borrowing from another job** is a checkbox that stores `source_job_number` and keeps the PM allocation-approval path. The reason dropdown captures *why* (scrap, nest wrong, short staged, customer rush, other). Legacy rows with `reason_code = 'borrow'` still count as borrows; new creates do not set that code. See also [contacts-and-activity.md](./contacts-and-activity.md).

## Backlog

- [ ] **Drop locations list** - Ask shop for real drop places; replace `MATERIAL_PULL_LOCATIONS` values (column is already `location`)
- [ ] **Admin feature flags** - see [project-backlog.md](./project-backlog.md)
- [ ] Reason trending report (reason codes are stored now; borrow flag is separate)

## Note on service worker

PWA uses committed `public/sw.js` (registered by `PwaRegister`). Serwist was not used because Next 16 Turbopack builds do not emit its worker reliably.
