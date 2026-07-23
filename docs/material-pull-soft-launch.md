# Material Pull — soft-launch checklist

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
- “Full CRM” link is hidden

Share only `https://pull.qbfab.com` with the floor team. Keep `crmv1.qbfab.com` for internal CRM use.

Local test: set `NEXT_PUBLIC_APP_MODE=pull` in `.env.local` and restart `pnpm dev`.

## Role matrix

| Seat | Role | Material Pull |
|------|------|---------------|
| Dylan | `admin` | Full access |
| Shane, Eric (Approval) | `manager` | Approve / edit / Batch |
| Material Handler (Tristan) | `manager` | Batch checklist / mark pulled |
| Floor requesters | `member` | New + status board; `requested_by` = their login |
| Read-only | `viewer` | Board only |

Funnel: **Submission → Approval → Batch & Pull** (no personal names in product UI).

## Before testers start

- [ ] Run migration `010_material_pull_requests.sql` in Supabase SQL Editor
- [ ] Run migration `011_material_pull_hierarchy.sql` (approved status, location, pull checklist columns)
- [ ] Confirm seed rows appear (or create a test request)
- [ ] Assign Approver / Material Handler accounts the `manager` role in Admin
- [ ] Assign floor requesters the `member` role
- [ ] Deploy pull Vercel project with `NEXT_PUBLIC_APP_MODE=pull`
- [ ] Set VAPID env vars for Web Push (optional but recommended)
- [ ] Confirm Resend is configured for email fallback

## Install on phone / tablet

- **Android / Chrome:** open `https://pull.qbfab.com` → Install banner or browser menu → Install app
- **iPhone / iPad:** Safari → Share → **Add to Home Screen** (banner on `/pull` explains this)
- Manifest allows any orientation; shell widens on tablet (`md`/`lg` breakpoints)

## Tester flows

1. **Requester (member)** — `/pull` → New → submit Job #, material, qty, location, needed-by (attributed to their login)
2. **Approver (manager)** — Requests board → Approve pending
3. **Material Handler (manager)** — Batch → select → Create pull list → Print → checklist + canned note → Mark pulled
4. **Notifications** — Enable on `/pull`; submit from another user; confirm push or email

Members do **not** see the Batch tab (redirected if they open `/pull/batch`).

## Success criteria

- Installable PWA opens to `/pull`
- Same data in CRM **Material Requests** nav
- Data persists across refresh / devices (Supabase)
- Status events notify via push or email fallback (opted-in profiles)

## Material catalog (searchable picker)

The Material field on `/pull/new` and CRM `/material-requests/new` uses a static catalog generated from the Procurement Status Log CSV.

1. Re-export / update  
   `data/docs/PROCUREMENT STATUS LOG.xlsx - MATERIAL LIST FOR PROJECTS.csv`
2. Regenerate: `pnpm catalog:materials`
3. Commit the updated `data/material-catalog.json`

## Backlog

- [ ] **Drop locations list** — Ask shop for real drop places; replace `MATERIAL_PULL_LOCATIONS` values (column is already `location`)
- [ ] **Admin feature flags** — see [project-backlog.md](./project-backlog.md)

## Note on service worker

PWA uses committed `public/sw.js` (registered by `PwaRegister`). Serwist was not used because Next 16 Turbopack builds do not emit its worker reliably.
