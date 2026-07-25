# Google OAuth for CRM (Gmail + Calendar)

Per-user Workspace OAuth for relationship CRM. **Not** the same as Supabase Auth “Sign in with Google”, and **not** the Drive service account used for job folders.

## Env

| Variable | Purpose |
|----------|---------|
| `GOOGLE_OAUTH_CLIENT_ID` | GCP OAuth Web client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Client secret |
| `GOOGLE_OAUTH_REDIRECT_URI` | e.g. `https://crmv1.qbfab.com/api/google/oauth/callback` |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | AES key for refresh tokens at rest (64 hex chars or passphrase) |

Also run migrations `018` (OAuth + email activities) and `019` (`crm_tasks` follow-ups) as needed.

## GCP setup

1. Create an OAuth **Web application** client.
2. Authorized redirect URI = `GOOGLE_OAUTH_REDIRECT_URI`.
3. Enable **Gmail API** and **Google Calendar API**.
4. Scopes on Connect: `gmail.readonly`, `gmail.send`, `calendar.events`, `userinfo.email`.

If you connected before send shipped, **Disconnect → Connect** again so Google issues a refresh token with `gmail.send`.

## Pilot usage

1. Settings → Integrations → **Connect Google**.
2. **Sync Gmail now** — last 30 days; threads matching CRM contact emails → `crm_activities` (`kind=email`).
3. **Sync Calendar now** — events ±14 days with known contact attendees → `kind=meeting`.
4. **Schedule meeting** / **Compose email** / **Reply** on Customer 360 — create Calendar events or send mail; both log to activity.
5. **Disconnect** deletes the stored token for this profile.

## Disconnect / re-consent

If Google returns no refresh token, remove the app under the user’s Google Account → Security → Third-party access, then Connect again.

## Security notes

- Refresh tokens are sealed with AES-GCM before insert into `google_oauth_tokens`.
- RLS: users can only read/write their own token row.
- Manual sync only (no cron / Pub/Sub).
