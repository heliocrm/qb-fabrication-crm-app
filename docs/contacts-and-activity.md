# Contacts + CRM activity

Relationship CRM: people under Accounts, manual notes, and Google-synced email/meetings on Contact / Account / Job timelines.

## Objects

### `contacts`

People at a customer account.

| Field | Notes |
|-------|--------|
| `account_id` | Parent account |
| `full_name`, `role_title`, `email`, `phone` | Core identity |
| `preferred_channel` | Optional preference |
| `personal_notes` | Relationship context |
| `relationship_owner_id` | Feeds **Needs a touch → My queue** |
| `last_contact_at` / `next_touch_at` / `next_touch_owner_id` | Touch planning |
| `is_primary` | One primary contact per account (UI/service enforces) |

Bootstrap: when listing contacts for an account that has denormalized `accounts.contact` / `email` / `phone` and zero contact rows, the service inserts one primary contact from those fields (owners remain null until claimed or seeded).

Migration: `017_contacts_and_crm_activities.sql`. Owner pilot seed + email kind: `018_google_oauth_and_email_activities.sql`.

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
| `external_id` | Stable id (thread/contact or event id); unique with org + source when set |

**Dedupe:** unique partial index on `(organization_id, external_source, external_id)` where both external fields are non-null.

**Not** the same as `activity_logs` (job system audit: uploads, status changes, task completes). Job Activity tab merges both feeds; “Add note” writes `crm_activities` only.

Logging a note/touch (or ingesting email/meeting) bumps `contacts.last_contact_at` when newer, and clears overdue `next_touch_at`.

## Google sync

See [google-oauth-crm.md](./google-oauth-crm.md). Settings → Integrations: Connect / Sync Gmail / Sync Calendar / Disconnect. Manual sync only.

## Needs a touch

Page: `/customers/needs-a-touch`.

- Due when `next_touch_at <= today`, or `last_contact_at` older than 90 days with no future next touch.
- Default filter **My queue** (`relationship_owner_id` or `next_touch_owner_id` = current profile). Managers/admins can view **All**.
- Empty My queue explains assigning an owner on Customer 360.
- Row actions: Open Customer 360, Log touch, Set next touch. **No Create task** until `crm_tasks` exists.

Claim ownership: contact form checkbox “I own this relationship”.

## UI

- **Customers → account detail:** Contacts (add/edit/owner), Schedule meeting, activity timeline + Add note.
- **Customers → Needs a touch:** Owner-filtered queue.
- **Jobs → Activity tab:** Merged system + CRM feed; Add note when the user can write.
- **Jobs → Overview / Customer 360:** Schedule meeting (Calendar + CRM log).

## Material Pull: borrow vs reason

Borrowing is a **flag** (checkbox → `source_job_number`), not a reason code. Reason stays scrap / nest wrong / short staged / rush / other so trending reflects root cause. Legacy `reason_code = 'borrow'` still counts as a borrow for allocation UX. Soft-launch notes: [material-pull-soft-launch.md](./material-pull-soft-launch.md).

## Follow-on (commercial layer)

Board in [project-backlog.md](./project-backlog.md): CRM Tasks → outbound Gmail → thin QuickBooks links → opportunity hardening → event-driven follow-ups → People API.
