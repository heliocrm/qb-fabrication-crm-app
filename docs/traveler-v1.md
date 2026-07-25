# Traveler (digital import)

Phone-first traveler **import** absorbed from Trevor’s desktop MVP, stored as an
in-system CRM record (not Drive-first Word).

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

Re-import creates a new traveler version and marks the prior active row
`superseded`. Old production cards are not auto-deleted.

## Soft-launch (like Material Pull)

| Env | Effect |
|-----|--------|
| `NEXT_PUBLIC_APP_MODE=traveler` | Standalone Traveler app |
| `NEXT_PUBLIC_TRAVELER_APP_HOSTS=traveler.qbfab.com` | Host allowlist on a shared deploy |
| Manifest | [`public/traveler.webmanifest`](../public/traveler.webmanifest) (`start_url: /traveler`) |

Do not set `APP_MODE=pull` and `APP_MODE=traveler` on the same deploy.

Run migrations through [`015_digital_travelers.sql`](../supabase/migrations/015_digital_travelers.sql)
in Supabase SQL Editor (after 012–014).

## Code map

| Area | Path |
|------|------|
| Parse WO PDF | `lib/travelers/parse-work-order.ts` |
| Customer name map | `lib/travelers/customer-map.ts` |
| Build `.docx` (on demand) | `lib/travelers/write-traveler.ts` |
| Actions | `lib/actions/travelers.ts` |
| Services | `lib/supabase/services/travelers.ts` |
| Job Traveler tab | `components/jobs/detail/job-traveler-tab.tsx` |
| Import UI | `components/travelers/traveler-job-flow.tsx` |
| Print | `/jobs/[id]/traveler/print`, `/traveler/jobs/[id]/print` |
| Mode / middleware | `lib/traveler-mode.ts`, `lib/supabase/middleware.ts` |

## Data model

- **`travelers`** — header (PO, customer, dates, rev, version, status)
- **`traveler_lines`** — WO lines; optional `line_item_id` → production card
- **`traveler_generations`** — audit log for DOCX exports only

## Adding a work-order format

QB-issued WOs are the primary path. Legacy triple-code-line parsing remains as
fallback. Every field stays editable in the UI and **Add line** covers misses.

## Deferred

- Floor step sign-offs / heat-MTR / NCR (extreme traceability next)
- Drawing packet combine / crop / stamp (`stamp_engine.py`)
- Reporting dashboard on traveler volume
- PowerFab sync
- Drive as traveler source of truth (optional archive only)
