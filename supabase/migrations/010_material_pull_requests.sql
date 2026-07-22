-- QB Fabrication CRM — migration 010
-- Material pull requests + Web Push subscriptions
-- Run AFTER 009 in Supabase SQL Editor

-- ─── 1. material_pull_requests ──────────────────────────────────────────────

create table if not exists public.material_pull_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  job_number text not null,
  material text not null,
  quantity numeric(12, 2) not null check (quantity > 0),
  unit text not null default 'ea',
  needed_by date,
  stage text,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'sourced', 'batched', 'pulled', 'cancelled')),
  requested_by uuid not null references public.profiles(id) on delete restrict,
  sourced_by uuid references public.profiles(id) on delete set null,
  pulled_by uuid references public.profiles(id) on delete set null,
  batch_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.material_pull_requests is
  'Floor material pull requests — funnel from requesters to Eric/Tristan workflow.';

create index if not exists idx_mpr_org_status
  on public.material_pull_requests (organization_id, status);
create index if not exists idx_mpr_org_needed_by
  on public.material_pull_requests (organization_id, needed_by);
create index if not exists idx_mpr_org_batch_id
  on public.material_pull_requests (organization_id, batch_id);
create index if not exists idx_mpr_job_id
  on public.material_pull_requests (job_id);

alter table public.material_pull_requests enable row level security;

create policy "mpr_select"
  on public.material_pull_requests for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

create policy "mpr_insert"
  on public.material_pull_requests for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
    and public.current_user_role() in ('admin', 'manager', 'member')
    and requested_by = public.current_profile_id()
  );

create policy "mpr_update"
  on public.material_pull_requests for update to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
    and (
      public.user_is_manager_or_admin()
      or (
        requested_by = public.current_profile_id()
        and status = 'pending'
      )
    )
  )
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

create policy "mpr_delete"
  on public.material_pull_requests for delete to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_is_manager_or_admin()
  );

grant select, insert, update, delete on public.material_pull_requests to authenticated;

-- ─── 2. push_subscriptions ──────────────────────────────────────────────────

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (endpoint)
);

comment on table public.push_subscriptions is
  'Web Push subscriptions for installed PWA devices.';

create index if not exists idx_push_subs_profile
  on public.push_subscriptions (profile_id);
create index if not exists idx_push_subs_org
  on public.push_subscriptions (organization_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subs_select_own"
  on public.push_subscriptions for select to authenticated
  using (
    profile_id = public.current_profile_id()
    and organization_id = public.current_organization_id()
  );

create policy "push_subs_insert_own"
  on public.push_subscriptions for insert to authenticated
  with check (
    profile_id = public.current_profile_id()
    and organization_id = public.current_organization_id()
  );

create policy "push_subs_delete_own"
  on public.push_subscriptions for delete to authenticated
  using (profile_id = public.current_profile_id());

grant select, insert, delete on public.push_subscriptions to authenticated;

-- ─── 3. Notification preference defaults (document keys) ────────────────────

comment on column public.profiles.notification_preferences is
  'User notification toggles: job_updates_email, task_assignments_email, material_request_push, material_request_email.';

-- ─── 4. Seed sample pull requests (when an org profile exists) ───────────────

insert into public.material_pull_requests (
  id, organization_id, job_id, job_number, material, quantity, unit,
  needed_by, stage, notes, status, requested_by
)
select
  v.id,
  'a0000000-0000-4000-8000-000000000001',
  v.job_id,
  v.job_number,
  v.material,
  v.quantity,
  v.unit,
  v.needed_by::date,
  v.stage,
  v.notes,
  v.status,
  p.id
from (
  values
    (
      'd0000000-0000-4000-8000-000000000001'::uuid,
      'a0000000-0000-4000-8000-000000000201'::uuid,
      'QB-2025-041',
      'L4x4x3/8 x 40'' A588',
      56,
      'ea',
      '2026-07-28',
      'Fabrication',
      'Need for McNary crossarm fit-up',
      'pending'
    ),
    (
      'd0000000-0000-4000-8000-000000000002'::uuid,
      'a0000000-0000-4000-8000-000000000201'::uuid,
      'QB-2025-041',
      'W6x15 x 40''',
      12,
      'ea',
      '2026-07-30',
      'Fabrication',
      null,
      'sourced'
    ),
    (
      'd0000000-0000-4000-8000-000000000003'::uuid,
      'a0000000-0000-4000-8000-000000000202'::uuid,
      'QB-2025-038',
      'L3½x3½x¼ x 31'' A588',
      42,
      'ea',
      '2026-07-25',
      'Machine',
      'Rush — Diablo Canyon',
      'batched'
    ),
    (
      'd0000000-0000-4000-8000-000000000004'::uuid,
      'a0000000-0000-4000-8000-000000000203'::uuid,
      'QB-2025-035',
      '8x8x⅝ x 40'' Grade 50',
      5,
      'ea',
      '2026-08-05',
      'Fabrication',
      'Pedestal bases',
      'pending'
    ),
    (
      'd0000000-0000-4000-8000-000000000005'::uuid,
      'a0000000-0000-4000-8000-000000000203'::uuid,
      'QB-2025-035',
      '5x5x5/16 x 40'' A529',
      20,
      'ea',
      '2026-08-05',
      'Fabrication',
      null,
      'pending'
    ),
    (
      'd0000000-0000-4000-8000-000000000006'::uuid,
      null::uuid,
      'QB-2025-050',
      'W8x28 x 49''',
      8,
      'ea',
      '2026-08-12',
      'Fabrication',
      'Job not yet in CRM — from procurement log',
      'pending'
    ),
    (
      'd0000000-0000-4000-8000-000000000007'::uuid,
      'a0000000-0000-4000-8000-000000000204'::uuid,
      'QB-2025-031',
      'L4x4x⅜ x 27'' A588',
      17,
      'ea',
      '2026-07-22',
      'Shipping',
      'Already pulled for John Day',
      'pulled'
    ),
    (
      'd0000000-0000-4000-8000-000000000008'::uuid,
      'a0000000-0000-4000-8000-000000000202'::uuid,
      'QB-2025-038',
      'Plate A36 ¾"',
      4,
      'ea',
      '2026-07-20',
      'Fabrication',
      'Cancelled — wrong thickness',
      'cancelled'
    )
) as v(id, job_id, job_number, material, quantity, unit, needed_by, stage, notes, status)
cross join lateral (
  select id
  from public.profiles
  where organization_id = 'a0000000-0000-4000-8000-000000000001'
    and is_active = true
  order by created_at asc
  limit 1
) p
on conflict (id) do nothing;

-- Assign a shared batch_id to the batched sample
update public.material_pull_requests
set batch_id = 'e0000000-0000-4000-8000-000000000001'
where id = 'd0000000-0000-4000-8000-000000000003'
  and batch_id is null;
