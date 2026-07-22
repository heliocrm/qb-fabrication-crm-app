# qb-fabrication-crm-app

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_5nPsJ0Rvdhg0z1DwwDuJLN3M6ByT)

## Material Pull (soft launch)

Floor-facing PWA + CRM module for material pull requests (service worker at `public/sw.js`).

1. Run Supabase migration [`supabase/migrations/010_material_pull_requests.sql`](supabase/migrations/010_material_pull_requests.sql).
2. Optional push alerts: generate VAPID keys (`npx web-push generate-vapid-keys`) and set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` in `.env.local` (see `.env.local.example`).
3. Dev: `pnpm dev` → CRM at `/material-requests`, floor shell at `/pull`.
4. **Standalone soft-launch (no CRM):** second Vercel project, same repo, set `NEXT_PUBLIC_APP_MODE=pull` and `NEXT_PUBLIC_SITE_URL=https://pull.qbfab.com`. Middleware locks the app to `/pull`; see [`docs/material-pull-soft-launch.md`](docs/material-pull-soft-launch.md).
5. Production: open the pull URL, install to home screen, enable notifications.

Flow: submit request → managers source → batch/print pull list → mark pulled. Email fallback uses Resend when push is unavailable.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
