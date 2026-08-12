# Trello import / one-way refresh (Settings → Trello)

Org-level API credentials (not per-user OAuth). Managers and admins can import
boards into CRM jobs and refresh previously imported jobs.

## Env

| Variable | Purpose |
|----------|---------|
| `TRELLO_API_KEY` | Power-Up / API key |
| `TRELLO_TOKEN` | Member token with read access to boards (`TRELLO_API_TOKEN` also accepted) |
| `TRELLO_BOARD_IDS` | Optional comma-separated allowlist of board ids |

Also run migration `023_trello_import_ids.sql` so `trello_board_id` / `trello_card_id` / `trello_checkitem_id` exist.

## Get a token

1. Create an API key at [Trello Power-Ups admin](https://trello.com/power-ups/admin).
2. Open (logged in as the Trello account that can see the boards):

```
https://trello.com/1/authorize?expiration=never&name=QB%20CRM&scope=read&response_type=token&key=YOUR_API_KEY
```

3. Click Allow and copy the token into Vercel / `.env.local` as `TRELLO_TOKEN`.

Read-only scope is enough for import and refresh.

## Mapping

| Trello | CRM |
|--------|-----|
| Board | Job (`jobs.trello_board_id`) |
| Card | Line item (`line_items.trello_card_id`) |
| Checklist item | Task (`tasks.trello_checkitem_id`) |
| List name | Line item WIP + contributes to job status |

Job status = furthest mapped list among open cards (`To Do` → `Delivered`). Closed boards map to `Delivered`.

Import does **not** re-seed template checklists; it copies Trello check items as-is.

## Usage

1. Settings → **Trello** (managers/admins).
2. **Import boards** → preview → select → commit.
3. **Refresh imported jobs** → re-pulls every job that has `trello_board_id`.

Refresh updates titles, descriptions, dates, statuses, and completed flags; creates missing cards/tasks. It does **not** delete CRM rows that disappeared from Trello (orphan counts are reported in the toast).

## Out of scope

Two-way sync, webhooks, attachments, comments, members, auto-linking customers.
