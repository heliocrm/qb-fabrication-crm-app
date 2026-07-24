-- Material Pull meeting prep: priority, reason, borrow source job, profile capabilities
-- Run after 011_material_pull_hierarchy.sql

-- 1) Request fields
alter table public.material_pull_requests
  add column if not exists priority text not null default 'soon';

alter table public.material_pull_requests
  add column if not exists reason_code text not null default 'other';

alter table public.material_pull_requests
  add column if not exists source_job_number text;

alter table public.material_pull_requests
  drop constraint if exists material_pull_requests_priority_check;

alter table public.material_pull_requests
  add constraint material_pull_requests_priority_check
  check (priority in ('hot', 'soon', 'low'));

alter table public.material_pull_requests
  drop constraint if exists material_pull_requests_reason_code_check;

alter table public.material_pull_requests
  add constraint material_pull_requests_reason_code_check
  check (
    reason_code in (
      'scrap',
      'nest_wrong',
      'short_staged',
      'customer_rush',
      'borrow',
      'other'
    )
  );

comment on column public.material_pull_requests.priority is
  'Urgency: hot (drop everything), soon (need-by), low (weekly).';

comment on column public.material_pull_requests.reason_code is
  'Root-cause category for trending (scrap, nest, short, rush, borrow, other).';

comment on column public.material_pull_requests.source_job_number is
  'Job number material is taken from when reason_code = borrow.';

-- 2) Profile capability overlays (no new OrganizationRole values)
alter table public.profiles
  add column if not exists material_pull_capabilities jsonb not null default '{}'::jsonb;

comment on column public.profiles.material_pull_capabilities is
  'Material Pull overlays: can_request, can_approve, can_batch, can_approve_allocation (booleans). Admin role always has all.';

-- 3) Soft-launch safe backfill: existing managers keep approve + batch until Admin tunes seats
update public.profiles
set material_pull_capabilities = coalesce(material_pull_capabilities, '{}'::jsonb)
  || jsonb_build_object(
    'can_approve', true,
    'can_batch', true,
    'can_request', true
  )
where role = 'manager'
  and is_active = true;

update public.profiles
set material_pull_capabilities = coalesce(material_pull_capabilities, '{}'::jsonb)
  || jsonb_build_object('can_request', true)
where role in ('member', 'admin')
  and is_active = true;
