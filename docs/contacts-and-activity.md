# Contacts + CRM activity + follow-ups

Relationship CRM: people under Accounts, activity timeline, Google sync, and **CRM follow-ups** (`crm_tasks`). Customer 360 is the hub.

## Objects

### `contacts`

People at a customer account.

| Field | Notes |
|-------|--------|
| `account_id` | Parent account |
| `full_name`, `role_title`, `email`, `phone` | Core identity |
| `preferred_channel` | Optional preference |
| `personal_notes` | Relationship context |
| `relationship_owner_id` | Feeds **Needs a touch → My queue**; default owner for new follow-ups |
| `last_contact_at` / `next_touch_at` / `next_touch_owner_id` | Touch planning |
| `is_primary` | One primary contact per account (UI/service enforces) |

Bootstrap: when listing contacts for an account that has denormalized `accounts.contact` / `email` / `phone` and zero contact rows, the service inserts one primary contact from those fields (owners remain null until claimed or seeded).

Migrations: `017` contacts/activities; `018` Google OAuth + email kind; `019` `crm_tasks`.

### `crm_activities`

Relationship events (manual + synced).

| Field | Notes |
|-------|--------|
| `account_id` / `contact_id` / `job_id` | At least one required |
| `kind` | `note` \| `call` \| `meeting` \| `touch` \| `email` |
| `body` | Required text (email subject for Gmail rows) |
| `occurred_at` | Defaults to now |
| `created_by` | Profile who wrote or synced |
| `metadata` | Subject, snippet, Meet/Calendar deep links, etc. |
| `external_source` | `gmail` \| `calendar` \| null for manual |
| `external_id` | Stable id; unique with org + source when set |

**Not** the same as `activity_logs` (job system audit).

### `crm_tasks` (CRM follow-ups)

Sales/relationship follow-ups. **UI label: Follow-up / Follow-ups.**

| Field | Notes |
|-------|--------|
| `title`, `body` | What to do |
| `due_at` / `completed_at` | Scheduling + completion |
| `owner_id` | Profile responsible — align with `relationship_owner_id` |
| `account_id` / `contact_id` / `opportunity_id` / `job_id` | At least one required |

**Not** the same as `public.tasks` (shop WIP checklists on line items / floor sign-off). Never overload those tables or call CRM follow-ups “tasks” alone in the UI next to shop language.

## Google sync + outbound email

See [google-oauth-crm.md](./google-oauth-crm.md). Settings → Integrations: Connect / Sync Gmail / Sync Calendar / Disconnect. Manual sync only.

**Outbound:** Customer 360 contact **Email** button and activity **Reply** send via connected Gmail (`gmail.send`) and log `crm_activities` (`kind=email`, `metadata.direction=outbound`). Reconnect Google if send scope is missing.

**People enrich (one-way):** Settings → **Enrich contacts** matches Google Contacts to existing CRM contacts by email and fills blank phone / role title only. Does not create CRM contacts from Google. Requires `contacts.readonly` (Disconnect → Connect if missing).

## Needs a touch

Page: `/customers/needs-a-touch`.

- Due when `next_touch_at <= today`, or `last_contact_at` older than 90 days with no future next touch.
- Default filter **My queue**; managers/admins can view **All**.
- Row actions: Open Customer 360, Log touch, Set next touch, **Create follow-up** (prefilled contact/account/owner).

Claim ownership: contact form checkbox “I own this relationship”.

## Opportunities (pipeline)

Separate from relationship CRM, but linked from Customer 360.

| Field | Notes |
|-------|--------|
| `assignee_id` | Pipeline owner (profile) — same ownership idea as `relationship_owner_id` |
| `win_loss_reason` | Required in UI when stage is Won or Lost (migration `021`) |
| `jobs.opportunity_id` | Won → **Create job** prefills account + links the job |

UI: `/opportunities/[id]` detail; kanban/list titles open detail; Customer 360 opps link there.

### Event: Job Delivered → 30-day check-in

When a job status **transitions** to `Delivered` (kanban or edit), the app creates one CRM follow-up (idempotent per job):

- Title: `30-day check-in — {jobNumber}`
- Due: status-change time + 30 days
- Owner: primary contact `relationship_owner_id`, else the user who marked Delivered
- Links: `job_id` + `account_id` (+ `contact_id` when resolved)

Appears on Customer 360 Follow-ups / owner’s open queue. Failure does not block the job status update. No other automated triggers yet.

## UI (Customer 360 hub)

- **Customers → account detail:** Contacts, email/meeting actions, **Follow-ups**, **QB Customer → Open in QuickBooks** chip (deep link + optional status note), activity, open jobs/opps (opps → detail).
- **Jobs → Overview / Edit:** Optional QB job deep link chip.
- **Customers → Needs a touch:** Queue + Create follow-up.
- **Jobs → Activity / Overview:** CRM notes + schedule meeting (shop checklist tasks remain on the job).
- **Opportunities:** Detail page with owner, win/loss reason, Create job from Won.

## Material Pull: borrow vs reason

Borrowing is a **flag** (checkbox → `source_job_number`), not a reason code. Soft-launch notes: [material-pull-soft-launch.md](./material-pull-soft-launch.md).

## QuickBooks (thin links)

No QB sync. Store `qb_customer_url` / optional `qb_customer_id` + `qb_status_note` on accounts; `qb_url` on jobs. Chip opens QBO in a new tab. Migration `020_quickbooks_deep_links.sql`.

## Commercial layer (remaining)

See [project-backlog.md](./project-backlog.md): opportunity hardening → event-driven follow-ups (Delivered → 30-day first) → People API.
