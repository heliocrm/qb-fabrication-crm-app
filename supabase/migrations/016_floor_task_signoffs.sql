-- QB Fabrication CRM — migration 016
-- Floor task sign-off: station accounts + PIN store + append-only task_signoffs
-- Run AFTER 015 in Supabase SQL Editor

alter table public.profiles
  add column if not exists is_station_account boolean not null default false;

comment on column public.profiles.is_station_account is
  'Shared tablet / kiosk Auth profile — floor sign-off requires worker picker + PIN.';

-- PIN hashes are NOT on profiles (org members can SELECT profiles).
-- Only the service role reads/writes this table via the admin client.
create table if not exists public.profile_floor_pins (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  pin_hash text not null,
  updated_at timestamptz not null default now()
);

comment on table public.profile_floor_pins is
  'scrypt PIN hashes for floor sign-off; no grants to authenticated.';

alter table public.profile_floor_pins enable row level security;
-- No policies for authenticated → deny by default. Service role bypasses RLS.

create table if not exists public.task_signoffs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  line_item_id uuid not null references public.line_items(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  traveler_line_id uuid references public.traveler_lines(id) on delete set null,
  signed_by uuid not null references public.profiles(id) on delete restrict,
  session_profile_id uuid not null references public.profiles(id) on delete restrict,
  reason_codes text[] not null default '{}',
  note text,
  signed_at timestamptz not null default now()
);

comment on table public.task_signoffs is
  'Append-only shop-floor sign-offs for checklist tasks (worker + PIN attested).';

create index if not exists idx_task_signoffs_task
  on public.task_signoffs (task_id, signed_at desc);

create index if not exists idx_task_signoffs_job
  on public.task_signoffs (job_id, signed_at desc);

create index if not exists idx_task_signoffs_line_item
  on public.task_signoffs (line_item_id, signed_at desc);

create index if not exists idx_task_signoffs_org
  on public.task_signoffs (organization_id);

alter table public.task_signoffs enable row level security;

create policy "task_signoffs_select"
  on public.task_signoffs for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

create policy "task_signoffs_insert"
  on public.task_signoffs for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

grant select, insert on public.task_signoffs to authenticated;
