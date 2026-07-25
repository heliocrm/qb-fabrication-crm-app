# Traveler (digital import + floor sign-off)

Phone-first traveler **import** absorbed from Trevor’s desktop MVP, stored as an
in-system CRM record (not Drive-first Word), plus shop-floor task sign-off.

## What it does

1. Open `/traveler` (PWA) or the job **Traveler** tab / **Import traveler**.
2. Pick a job.
3. Upload a QB work-order PDF → parse Customer (Ship To), PO, Order Date, QB SO,
   Ship Date, and every catalog line (line #, qty, catalog ID, description).
4. Structure # is auto-filled from marks like `(MK-0532R)` when present; review
   or **Fill N/A**.
5. **Import traveler** → saves `travelers` + `traveler_lines`, seeds linked CRM
   production `line_items` (template checklists), soft-syncs job PO / marks.
6. Anytime: **Print** (HTML), **Email** (deep link via Resend), **Download DOCX**
   (built from DB; logged in `traveler_generations`).
7. **Floor sign-off** on Machine / Fabrication / QA / Shipping checklist tasks:
   pick worker + PIN + reason chips (+ optional note). Viewers may sign off;
   they still cannot edit the job.

Re-import creates a new traveler version and marks the prior active row
`superseded`. Old production cards are not auto-deleted.

## Station tablets (shared login)

- Create a kiosk Auth user and mark **Station / tablet account** in Admin → Users.
- Set a **floor PIN** on each real worker (4–8 digits).
- Tablet stays signed in as the station account; each sign-off requires choosing
  the worker and entering their PIN (does not switch Google OAuth sessions).
- Personal logins default the worker picker to self; PIN is still required.

Does not change Google OAuth clients or `qbfab.com` / `traveler.qbfab.com`
redirect configuration.

## Soft-launch (like Material Pull)

| Env | Effect |
|-----|--------|
| `NEXT_PUBLIC_APP_MODE=traveler` | Standalone Traveler app |
| `NEXT_PUBLIC_TRAVELER_APP_HOSTS=traveler.qbfab.com` | Host allowlist on a shared deploy |
| Manifest | [`public/traveler.webmanifest`](../public/traveler.webmanifest) (`start_url: /traveler`) |

Do not set `APP_MODE=pull` and `APP_MODE=traveler` on the same deploy.

Run migrations through [`016_floor_task_signoffs.sql`](../supabase/migrations/016_floor_task_signoffs.sql)
in Supabase SQL Editor (after 015).

## Code map

| Area | Path |
|------|------|
| Parse WO PDF | `lib/travelers/parse-work-order.ts` |
| Import / export | `lib/actions/travelers.ts` |
| Floor sign-off | `lib/actions/floor-signoff.ts`, `lib/supabase/services/task-signoffs.ts` |
| PIN hashing | `lib/floor-pin.ts` |
| Reason chips | `lib/floor-signoff-reasons.ts` |
| Job Traveler tab | `components/jobs/detail/job-traveler-tab.tsx` |
| Floor UI | `components/floor/` |
| PWA floor panel | `components/travelers/traveler-floor-panel.tsx` |

## Data model

- **`travelers`** / **`traveler_lines`** — digital traveler
- **`traveler_generations`** — DOCX export audit
- **`profiles.is_station_account`** — kiosk Auth profile flag
- **`profile_floor_pins`** — PIN hashes (service role only; not readable by clients)
- **`task_signoffs`** — append-only who/when/reasons per checklist task
- **`activity_logs`** — human-readable feed on sign-off

## Deferred

- Heat # / MTR / NCR
- Photo on sign-off
- Hard gates blocking ship until all steps signed
- Manager void/amend UI for sign-offs
- Drawing packet stamp workflow
- PowerFab sync
