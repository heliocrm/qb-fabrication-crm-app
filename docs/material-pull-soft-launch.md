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

## Before testers start

- [ ] Run migration `010_material_pull_requests.sql` in Supabase SQL Editor
- [ ] Confirm seed rows appear (or create a test request)
- [ ] Assign Eric / Tristan accounts the `manager` role in Admin
- [ ] Deploy pull Vercel project with `NEXT_PUBLIC_APP_MODE=pull`
- [ ] Set VAPID env vars for Web Push (optional but recommended)
- [ ] Confirm Resend is configured for email fallback

## Install on phone / tablet

- **Android / Chrome:** open `https://pull.qbfab.com` → Install banner or browser menu → Install app
- **iPhone / iPad:** Safari → Share → **Add to Home Screen** (banner on `/pull` explains this)
- Manifest allows any orientation; shell widens on tablet (`md`/`lg` breakpoints)

## Tester flows

1. **Foreman (member)** — open `/pull` on phone or tablet → Install app → New → submit Job #, material, qty, needed-by
2. **Eric (manager)** — `/pull` or `/material-requests` → see pending → Source
3. **Tristan (manager)** — Batch → select items → Create pull list → Print → Mark all pulled
4. **Notifications** — Enable on `/pull`; submit from another user; confirm push or email

## Success criteria

- Installable PWA opens to `/pull`
- Same data in CRM **Material Requests** nav
- Data persists across refresh / devices (Supabase)
- Status events notify via push or email fallback

## Note on service worker

PWA uses committed `public/sw.js` (registered by `PwaRegister`). Serwist was not used because Next 16 Turbopack builds do not emit its worker reliably.
