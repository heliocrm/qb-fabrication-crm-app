# Material Pull — soft-launch checklist

## Before testers start

- [ ] Run migration `010_material_pull_requests.sql` in Supabase SQL Editor
- [ ] Confirm seed rows appear (or create a test request)
- [ ] Assign Eric / Tristan accounts the `manager` role in Admin
- [ ] Set VAPID env vars for Web Push (optional but recommended)
- [ ] Confirm Resend is configured for email fallback

## Tester flows

1. **Foreman (member)** — open `/pull` on phone → Install app → New → submit Job #, material, qty, needed-by
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
