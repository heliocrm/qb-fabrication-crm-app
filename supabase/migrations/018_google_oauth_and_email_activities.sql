-- QB Fabrication CRM — migration 018
-- Per-user Google OAuth tokens + email/calendar activity dedupe
-- Run AFTER 017 in Supabase SQL Editor

-- ─── Google OAuth tokens (per profile) ──────────────────────────────────────
create table if not exists public.google_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  encrypted_refresh_token text not null,
  scopes text[] not null default '{}',
  token_expiry timestamptz,
  last_gmail_sync_at timestamptz,
  last_calendar_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.google_oauth_tokens is
  'Per-user Google Workspace OAuth refresh tokens (encrypted). Separate from Supabase Google login.';

create index if not exists idx_google_oauth_tokens_org
  on public.google_oauth_tokens (organization_id);

drop trigger if exists set_google_oauth_tokens_updated_at on public.google_oauth_tokens;
create trigger set_google_oauth_tokens_updated_at
  before update on public.google_oauth_tokens
  for each row execute function public.set_updated_at();

alter table public.google_oauth_tokens enable row level security;

create policy "google_oauth_tokens_select_own"
  on public.google_oauth_tokens for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
    and profile_id = (
      select id from public.profiles
      where user_id = auth.uid()
      limit 1
    )
  );

create policy "google_oauth_tokens_insert_own"
  on public.google_oauth_tokens for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
    and profile_id = (
      select id from public.profiles
      where user_id = auth.uid()
      limit 1
    )
  );

create policy "google_oauth_tokens_update_own"
  on public.google_oauth_tokens for update to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
    and profile_id = (
      select id from public.profiles
      where user_id = auth.uid()
      limit 1
    )
  )
  with check (
    organization_id = public.current_organization_id()
    and profile_id = (
      select id from public.profiles
      where user_id = auth.uid()
      limit 1
    )
  );

create policy "google_oauth_tokens_delete_own"
  on public.google_oauth_tokens for delete to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
    and profile_id = (
      select id from public.profiles
      where user_id = auth.uid()
      limit 1
    )
  );

-- ─── CRM activities: email kind + external dedupe ───────────────────────────
alter table public.crm_activities
  drop constraint if exists crm_activities_kind_check;

alter table public.crm_activities
  add constraint crm_activities_kind_check
  check (kind in ('note', 'call', 'meeting', 'touch', 'email'));

alter table public.crm_activities
  add column if not exists external_source text;

alter table public.crm_activities
  add column if not exists external_id text;

comment on column public.crm_activities.external_source is
  'Origin system for synced rows: gmail | calendar | null for manual.';

comment on column public.crm_activities.external_id is
  'Stable id in origin system (Gmail threadId, Calendar eventId).';

create unique index if not exists idx_crm_activities_external_dedupe
  on public.crm_activities (organization_id, external_source, external_id)
  where external_source is not null and external_id is not null;

-- Pilot seed: assign unowned contacts (with email) to the earliest active
-- admin/manager in the org so "My queue" is usable after migrate.
update public.contacts c
set relationship_owner_id = p.id
from (
  select distinct on (organization_id) id, organization_id
  from public.profiles
  where is_active = true
    and role in ('admin', 'manager')
  order by organization_id, created_at asc
) p
where c.organization_id = p.organization_id
  and c.relationship_owner_id is null
  and c.email is not null
  and btrim(c.email) <> '';
