# Traveler v1 (PWA)

Phone-first traveler generation absorbed from Trevor’s desktop MVP.

## What v1 does

1. Open `/traveler` (or install the Traveler PWA).
2. Pick a job.
3. Upload a customer work-order PDF → parse Customer / PO / Order Date / Catalog IDs.
4. Enter Structure # per line (or **Fill N/A**).
5. **Generate traveler** → Word `.docx` uploaded to the job’s Google Drive folder, logged in `traveler_generations`, linked as a `Traveler` document.

Full CRM job pages deep-link via **Traveler** → `/traveler/jobs/[id]`.

## Soft-launch (like Material Pull)

| Env | Effect |
|-----|--------|
| `NEXT_PUBLIC_APP_MODE=traveler` | Standalone Traveler app |
| `NEXT_PUBLIC_TRAVELER_APP_HOSTS=traveler.qbfab.com` | Host allowlist on a shared deploy |
| Manifest | [`public/traveler.webmanifest`](../public/traveler.webmanifest) (`start_url: /traveler`) |

Do not set `APP_MODE=pull` and `APP_MODE=traveler` on the same deploy.

Run migration [`012_traveler_generations.sql`](../supabase/migrations/012_traveler_generations.sql) in Supabase SQL Editor.

## Code map

| Area | Path |
|------|------|
| Parse WO PDF | `lib/travelers/parse-work-order.ts` |
| Customer name map | `lib/travelers/customer-map.ts` |
| Build `.docx` | `lib/travelers/write-traveler.ts` |
| Mode / middleware | `lib/traveler-mode.ts`, `lib/supabase/middleware.ts` |
| Actions | `lib/actions/travelers.ts` |
| UI | `app/(traveler)/`, `components/travelers/` |

## Adding a work-order format

Parsers follow Trevor’s pattern: detect three consecutive “code lines” (line #, qty, catalog ID), then find the description before/after the block. Extend `lib/travelers/parse-work-order.ts` when a new customer layout fails; every field stays editable in the UI and **Add line** covers misses.

## Template note

Official `QB_Traveler_Master_Copy.docx` styling can be dropped under `assets/travelers/` later. v1 builds a structured traveler `.docx` in code with the same fields (Document #, Rev, Customer, PO, Catalog IDs, Structure #, dates). See `assets/travelers/README.md`.

## Deferred

- Drawing packet combine / crop / stamp (`stamp_engine.py`) — not PWA-friendly; follow-up.
- Reporting dashboard on traveler volume.
- PowerFab sync.
- Floor piece-tracking (“I finished weld”) — different product; prefer PowerFab Go later.
