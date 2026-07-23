-- Material Pull hierarchy: approved status, location column, batch completion fields
-- Run in Supabase SQL Editor after deploy (after 010_material_pull_requests.sql).

-- 1) Relax status check, then sourced → approved, then tighten
alter table public.material_pull_requests
  drop constraint if exists material_pull_requests_status_check;

update public.material_pull_requests
set status = 'approved'
where status = 'sourced';

alter table public.material_pull_requests
  add constraint material_pull_requests_status_check
  check (status in ('pending', 'approved', 'batched', 'pulled', 'cancelled'));

-- 2) Rename columns
alter table public.material_pull_requests
  rename column stage to location;

alter table public.material_pull_requests
  rename column sourced_by to approved_by;

-- 3) Batch completion metadata
alter table public.material_pull_requests
  add column if not exists pull_notes text;

alter table public.material_pull_requests
  add column if not exists pull_checklist jsonb;

comment on table public.material_pull_requests is
  'Material pull funnel: Submission → Approval → Batch & Pull.';

comment on column public.material_pull_requests.location is
  'Drop location where material should be placed (shop area).';

comment on column public.material_pull_requests.approved_by is
  'Profile that approved the request (manager/admin).';

comment on column public.material_pull_requests.pull_notes is
  'Canned or free-text note from Material Handler when marking pulled.';

comment on column public.material_pull_requests.pull_checklist is
  'JSON checklist completion payload for the pull batch line.';
