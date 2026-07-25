# Section access by role

Org admins control which **roles** can see each main-menu module. Access is
**not** per-user or per-group (those can be layered later on the same
`section_key` model).

## How it works

1. **Registry** — [`lib/section-registry.ts`](../lib/section-registry.ts) is the
   single source of truth for section keys, routes, labels, and defaults.
   [`lib/nav-config.ts`](../lib/nav-config.ts) adds icons for the sidebar.
2. **Overrides** — table `organization_section_access` stores per-org
   `(section_key, role) → enabled`. Missing rows mean “use registry
   `defaultRoles`”.
3. **Resolution** — [`lib/auth/section-access.ts`](../lib/auth/section-access.ts)
   `canViewSection()`:
   - `access: "always"` → everyone (Dashboard, Settings)
   - `access: "admin"` → admins only (Admin)
   - `access: "configurable"` → org override, else `defaultRoles`
4. **Enforcement** — sidebar filters via shell layout; middleware redirects
   blocked URLs to `/`. Soft-launch pull/traveler hosts skip this guard.

Admin UI: **Admin → Organization Settings → Section access**.

## Checklist: add a new module (e.g. Tekla / ADP)

1. Add a `SectionDefinition` in [`lib/section-registry.ts`](../lib/section-registry.ts):
   - `sectionKey`: stable string (e.g. `"tekla"`) — **no DB migration for the key**
   - `href`, `label`, `description`
   - `access: "configurable"`
   - `defaultRoles`: usually `ALL_ORGANIZATION_ROLES`, or tighten for soft launch
     (e.g. `["admin", "manager"]`)
2. Map an icon for that `sectionKey` in [`lib/nav-config.ts`](../lib/nav-config.ts).
3. Add the route under `app/(shell)/…` (and any feature tables/APIs the module needs).
4. No change required to Admin UI or middleware — both read the registry.
5. Optionally flip roles in **Admin → Organization Settings** after deploy.
6. Keep action-level permissions (`canWriteJobs`, etc.) separate from section
   visibility.

Do **not** add a Postgres enum for section keys. Do **not** add per-user or
group access unless product requires it — extend this same `section_key` model.

## Future: org-level “module enabled”

For integrations (Tekla connected, license on, etc.), add an org flag that sits
*above* role visibility:

`module enabled for org` AND `role can view section`

Reuse the same `section_key`; no rename needed.

## Related files

| Piece | Path |
|-------|------|
| Registry (edge-safe) | `lib/section-registry.ts` |
| Nav + icons | `lib/nav-config.ts` |
| Pure helpers | `lib/auth/section-access.ts` |
| DB load | `lib/auth/load-section-access.ts` |
| Upsert | `lib/supabase/services/section-access.ts` |
| Admin action | `setSectionAccessAction` in `lib/actions/admin.ts` |
| Migration | `supabase/migrations/014_organization_section_access.sql` |
| Admin UI | `components/admin/section-access-matrix.tsx` |
