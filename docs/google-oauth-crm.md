# Google OAuth for CRM (Gmail + Calendar + Contacts)

Per-user Workspace OAuth for relationship CRM. **Not** the same as Supabase Auth “Sign in with Google”, and **not** the Drive service account used for job folders.

## Env

| Variable | Purpose |
|----------|---------|
| `GOOGLE_OAUTH_CLIENT_ID` | GCP OAuth Web client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Client secret |
| `GOOGLE_OAUTH_REDIRECT_URI` | e.g. `https://crmv1.qbfab.com/api/google/oauth/callback` |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | AES key for refresh tokens at rest (64 hex chars or passphrase) |

Also run migrations `018`–`021` as needed for OAuth, follow-ups, QB links, and opportunity hardening.

## GCP setup

1. Create an OAuth **Web application** client.
2. Authorized redirect URI = `GOOGLE_OAUTH_REDIRECT_URI`.
3. Enable **Gmail API**, **Google Calendar API**, and **People API**.
4. Scopes on Connect: `gmail.readonly`, `gmail.send`, `calendar.events`, `contacts.readonly`, `userinfo.email`.

If you connected before send or Contacts enrich shipped, **Disconnect → Connect** again so Google issues a refresh token with the new scopes.

## Pilot usage

1. Settings → Integrations → **Connect Google**.
2. **Sync Gmail now** — last 30 days; threads matching CRM contact emails → `crm_activities` (`kind=email`).
3. **Sync Calendar now** — events ±14 days with known contact attendees → `kind=meeting`.
4. **Enrich contacts** — match Google Contacts to existing CRM contacts by email; fill blank phone / role title only. Does **not** create CRM contacts from Google.
5. **Import Google contacts** — preview People API connections, select rows, then create CRM accounts/contacts (review required). See below.
6. **Schedule meeting** / **Compose email** / **Reply** on Customer 360 — create Calendar events or send mail; both log to activity.
7. **Disconnect** deletes the stored token for this profile.

### Import Google contacts (vs Enrich)

| | Enrich | Import |
|-|--------|--------|
| Creates CRM contacts/accounts | No | Yes (selected rows only) |
| Match rule | Email → existing CRM contact | Org-wide email dedupe; never duplicates |
| UI | One-click | Review dialog (select, account, owner) |
| Who | Any user with Google connected + `contacts.readonly` | Same |

Import rules:

- Email required (no-email rows are skipped).
- If email already exists in the org CRM → `exists` (optional enrich only).
- Company name matches an account (case-insensitive) → new contact on that account.
- Company with no match → create account (short name derived) + contact.
- No company → user must pick an existing account or type a new account name before import.
- Default relationship owner = importer; per-row and bulk reassignment in the review UI.
- Pre-selects recommended rows (`new_on_account`, `new_account`).

Manual only (no cron). Same People API scope as enrich.

## Disconnect / re-consent

If Google returns no refresh token, remove the app under the user’s Google Account → Security → Third-party access, then Connect again.

## Security notes

- Refresh tokens are sealed with AES-GCM before insert into `google_oauth_tokens`.
- RLS: users can only read/write their own token row.
- Manual sync / enrich / import only (no cron / Pub/Sub).
