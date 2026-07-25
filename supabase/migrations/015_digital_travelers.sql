-- QB Fabrication CRM — migration 015
-- Digital travelers (in-system record) + traveler lines
-- Run AFTER 014 in Supabase SQL Editor

create table if not exists public.travelers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  po_number text not null,
  customer text,
  order_date text,
  rev_number text,
  qb_sales_order text,
  ship_date text,
  source_document_id uuid references public.documents(id) on delete set null,
  version integer not null check (version > 0),
  status text not null default 'active'
    check (status in ('draft', 'active', 'superseded')),
  imported_by uuid references public.profiles(id) on delete set null,
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, job_id, po_number, version)
);

comment on table public.travelers is
  'Digital traveler header imported from QB work-order PDFs (source of truth).';

create index if not exists idx_travelers_job
  on public.travelers (job_id, imported_at desc);

create index if not exists idx_travelers_org_status
  on public.travelers (organization_id, status);

create index if not exists idx_travelers_job_active
  on public.travelers (job_id)
  where status = 'active';

create table if not exists public.traveler_lines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  traveler_id uuid not null references public.travelers(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  line_number text,
  quantity numeric not null default 1,
  catalog_id text not null,
  description text,
  structure_number text,
  line_item_id uuid references public.line_items(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.traveler_lines is
  'WO catalog lines for a digital traveler; optionally linked to CRM production line_items.';

create index if not exists idx_traveler_lines_traveler
  on public.traveler_lines (traveler_id, sort_order);

create index if not exists idx_traveler_lines_job
  on public.traveler_lines (job_id);

create index if not exists idx_traveler_lines_line_item
  on public.traveler_lines (line_item_id);

alter table public.travelers enable row level security;
alter table public.traveler_lines enable row level security;

create policy "travelers_select"
  on public.travelers for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

create policy "travelers_insert"
  on public.travelers for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
    and public.current_user_role() in ('admin', 'manager', 'member')
  );

create policy "travelers_update"
  on public.travelers for update to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
    and public.current_user_role() in ('admin', 'manager', 'member')
  )
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
    and public.current_user_role() in ('admin', 'manager', 'member')
  );

create policy "traveler_lines_select"
  on public.traveler_lines for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

create policy "traveler_lines_insert"
  on public.traveler_lines for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
    and public.current_user_role() in ('admin', 'manager', 'member')
  );

create policy "traveler_lines_update"
  on public.traveler_lines for update to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
    and public.current_user_role() in ('admin', 'manager', 'member')
  )
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
    and public.current_user_role() in ('admin', 'manager', 'member')
  );

grant select, insert, update on public.travelers to authenticated;
grant select, insert, update on public.traveler_lines to authenticated;
