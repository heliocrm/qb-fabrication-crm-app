# QB Fabrication CRM — project backlog

Cross-cutting items that are intentionally not in the current soft-launch builds.

## Admin feature flags

Build an Admin tool with on/off toggles for modules and functions as the product grows, for example:

- Material Pull module
- Batch / Pull workspace
- Web Push / email channels
- Catalog sources
- Future inventory / receiving features

Support hierarchy and permission overlays over time (who can enable what), without shipping new `OrganizationRole` values for every seat.

## Material Pull — location options

Done: `MATERIAL_PULL_LOCATIONS` in `lib/material-pull-config.ts` uses shop equipment/area names (Angle Master, Shear, Brake, Beam Line, Plate Burner, Blacktop). Future: admin-editable list if locations change often.

## Material catalog shape hierarchy

Group the searchable material picker by shape family (angles, WF, HSS, pipe) for faster browse on the floor.

## Profile QB logo avatars + job cover images

Aesthetic personalization (planned, not started):

- **Profile avatars:** Keep photo upload; add dual mode so users can instead pick a colorized QB logo (orange, navy, steel, forest, white, charcoal). Initials remain last-resort fallback.
- **Job covers:** Per-job cover image with opacity presets (Subtle 20% / Medium 35% / Bold 50%). Show on Kanban card background, job detail header, and a lighter wash behind the tabs/content area.

Plan: Cursor plan `avatar_and_job_covers` (Profile QB Logos + Job Cover Images).

## Relationship CRM — Google + health (follow-on)

Shipped: Contacts under Accounts + manual `crm_activities` notes (see [contacts-and-activity.md](./contacts-and-activity.md)). Not in this build:

- Gmail OAuth pilot / thread sync into `crm_activities`
- Calendar two-way sync
- Relationship health / dormant queue dashboard

## Floor PIN — self-serve + email reset

Today floor sign-off PINs are **admin-only** (Admin → Users: set / clear). Backlog:

- **Self-serve:** Signed-in workers can set or change their own floor PIN from Profile (current PIN required to change, or first-time set with no current PIN).
- **Forgot PIN:** Email a short-lived reset link (or one-time code) similar to password reset, scoped only to floor PIN — not login password.
- Keep admin set/clear as override for shop support and station onboarding.
