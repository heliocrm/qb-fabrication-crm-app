# Contacts + manual CRM activity

First relationship CRM slice: people under Accounts, and manual notes on Contact / Account / Job timelines. Google Gmail / Calendar sync is intentionally out of scope (follow-on).

## Objects

### `contacts`

People at a customer account.

| Field | Notes |
|-------|--------|
| `account_id` | Parent account |
| `full_name`, `role_title`, `email`, `phone` | Core identity |
| `preferred_channel` | Optional preference |
| `personal_notes` | Relationship context |
| `relationship_owner_id` | Optional owner (profile) |
| `last_contact_at` / `next_touch_at` / `next_touch_owner_id` | Touch planning |
| `is_primary` | One primary contact per account (UI/service enforces) |

Bootstrap: when listing contacts for an account that has denormalized `accounts.contact` / `email` / `phone` and zero contact rows, the service inserts one primary contact from those fields.

Migration: `017_contacts_and_crm_activities.sql`.

### `crm_activities`

Manual relationship events (notes, calls, meetings, touches).

| Field | Notes |
|-------|--------|
| `account_id` / `contact_id` / `job_id` | At least one required |
| `kind` | `note` \| `call` \| `meeting` \| `touch` |
| `body` | Required text |
| `occurred_at` | Defaults to now |
| `created_by` | Profile who wrote it |
| `metadata` | JSON bag for future sync payloads |

**Not** the same as `activity_logs` (job system audit: uploads, status changes, task completes). Job Activity tab merges both feeds; “Add note” writes `crm_activities` only.

## UI

- **Customers → account detail:** Contacts list (add/edit), account activity timeline + Add note.
- **Jobs → Activity tab:** Merged system + CRM feed; Add note when the user can write.

## Material Pull: borrow vs reason

Borrowing is a **flag** (checkbox → `source_job_number`), not a reason code. Reason stays scrap / nest wrong / short staged / rush / other so trending reflects root cause. Legacy `reason_code = 'borrow'` still counts as a borrow for allocation UX. Soft-launch notes: [material-pull-soft-launch.md](./material-pull-soft-launch.md).

## Follow-on (not in this build)

- Google OAuth / Gmail thread sync into `crm_activities`
- Calendar two-way sync
- Relationship health / dormant queue dashboard
- Optional link from job notes to a specific contact on the job’s account
