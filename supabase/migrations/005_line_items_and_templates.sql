-- QB Fabrication CRM — migration 005
-- Line items, job templates, task categories (Trello parity)
-- Run in Supabase SQL Editor AFTER 004
-- https://supabase.com/dashboard/project/wkutsmgonkawgbidinwx/sql

-- ─── Line items (Trello card parity) ─────────────────────────────────────────
create table if not exists public.line_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  title text not null,
  description text,
  quantity int not null default 1 check (quantity > 0),
  line_item_number text,
  wip_status text not null default 'To Do'
    check (wip_status in ('To Do', 'Doing', 'Done')),
  sort_order int not null default 0,
  delivery_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.line_items is
  'Production line item per job (Trello card). Tasks and optional documents nest under a line item.';

-- ─── Jobs: template type ─────────────────────────────────────────────────────
alter table public.jobs
  add column if not exists job_template text
    check (job_template is null or job_template in (
      'qb_project', 'crossarm', 'pedestal', 'miscellaneous'
    ));

comment on column public.jobs.job_template is
  'Checklist template used at job creation: qb_project, crossarm, pedestal, miscellaneous.';

-- ─── Tasks: line item FK (nullable during backfill) ────────────────────────────
alter table public.tasks
  add column if not exists line_item_id uuid references public.line_items(id) on delete cascade;

-- ─── Documents: optional line item scope ─────────────────────────────────────
alter table public.documents
  add column if not exists line_item_id uuid references public.line_items(id) on delete set null;

-- ─── Backfill: one "General" line item per existing job ────────────────────────
insert into public.line_items (
  organization_id,
  job_id,
  title,
  quantity,
  wip_status,
  sort_order
)
select
  j.organization_id,
  j.id,
  'General',
  1,
  'Doing',
  0
from public.jobs j
where j.organization_id is not null
  and not exists (
    select 1 from public.line_items li where li.job_id = j.id
  );

update public.tasks t
set line_item_id = li.id
from public.line_items li
where li.job_id = t.job_id
  and li.title = 'General'
  and t.line_item_id is null;

-- Do NOT auto-scope documents to line items; scope is set explicitly per document below

-- Migrate legacy task categories to Trello checklist groups
update public.tasks
set category = case category
  when 'Engineering' then 'Programming'
  when 'QC' then 'Quality Assurance'
  when 'Logistics' then 'Shipping'
  when 'Fabrication' then 'Fabrication'
  else category
end
where category in ('Engineering', 'QC', 'Logistics', 'Fabrication');

-- Enforce line item on tasks + 6-category constraint
alter table public.tasks
  alter column line_item_id set not null;

alter table public.tasks
  drop constraint if exists tasks_category_check;

alter table public.tasks
  add constraint tasks_category_check
  check (category in (
    'Programming',
    'Machine',
    'Fabrication',
    'Quality Assurance',
    'Shipping',
    'Office'
  ));

-- ─── updated_at trigger for line_items ───────────────────────────────────────
drop trigger if exists set_line_items_updated_at on public.line_items;
create trigger set_line_items_updated_at
  before update on public.line_items
  for each row execute function public.set_updated_at();

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists idx_line_items_job_id on public.line_items(job_id);
create index if not exists idx_line_items_organization_id on public.line_items(organization_id);
create index if not exists idx_line_items_job_sort on public.line_items(job_id, sort_order);
create index if not exists idx_line_items_wip_status on public.line_items(job_id, wip_status);

create index if not exists idx_tasks_line_item_id on public.tasks(line_item_id);
create index if not exists idx_tasks_line_item_sort on public.tasks(line_item_id, sort_order);

create index if not exists idx_documents_line_item_id on public.documents(line_item_id)
  where line_item_id is not null;

-- ─── Row Level Security ──────────────────────────────────────────────────────
alter table public.line_items enable row level security;

create policy "line_items_tenant_select"
  on public.line_items for select to authenticated
  using (organization_id = public.current_organization_id());

create policy "line_items_tenant_insert"
  on public.line_items for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and exists (
      select 1 from public.jobs j
      where j.id = job_id and j.organization_id = public.current_organization_id()
    )
  );

create policy "line_items_tenant_update"
  on public.line_items for update to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy "line_items_tenant_delete"
  on public.line_items for delete to authenticated
  using (organization_id = public.current_organization_id());

-- Tighten task insert policy to verify line item belongs to tenant + job
drop policy if exists "tasks_tenant_insert" on public.tasks;

create policy "tasks_tenant_insert"
  on public.tasks for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and exists (
      select 1 from public.jobs j
      where j.id = job_id and j.organization_id = public.current_organization_id()
    )
    and exists (
      select 1 from public.line_items li
      where li.id = line_item_id
        and li.job_id = job_id
        and li.organization_id = public.current_organization_id()
    )
  );

-- ─── Demo seed enhancements (post-backfill) ──────────────────────────────────
-- Assign templates and rename placeholder line items for seeded demo jobs

update public.jobs
set job_template = 'crossarm'
where id = 'a0000000-0000-4000-8000-000000000201';

update public.jobs
set job_template = 'crossarm'
where id = 'a0000000-0000-4000-8000-000000000202';

update public.jobs
set job_template = 'pedestal'
where id = 'a0000000-0000-4000-8000-000000000203';

update public.jobs
set job_template = 'qb_project'
where id = 'a0000000-0000-4000-8000-000000000204';

update public.jobs
set job_template = 'miscellaneous'
where id = 'a0000000-0000-4000-8000-000000000205';

update public.line_items li
set
  title = 'MK-230H Crossarm Assembly',
  line_item_number = 'MK-230H-01',
  quantity = 4,
  wip_status = 'Doing',
  sort_order = 0
from public.jobs j
where li.job_id = j.id
  and j.id = 'a0000000-0000-4000-8000-000000000201';

update public.line_items li
set
  title = 'MK-115DC Double-Circuit Crossarm',
  line_item_number = 'MK-115DC-A',
  quantity = 2,
  wip_status = 'Doing',
  sort_order = 0
from public.jobs j
where li.job_id = j.id
  and j.id = 'a0000000-0000-4000-8000-000000000202';

update public.line_items li
set
  title = 'MK-E Pedestal Bases',
  line_item_number = 'MK-E-P01',
  quantity = 6,
  wip_status = 'To Do',
  sort_order = 0
from public.jobs j
where li.job_id = j.id
  and j.id = 'a0000000-0000-4000-8000-000000000203';

update public.line_items li
set
  title = '500kV Tower Base Plates',
  line_item_number = 'MK-500-BP01',
  quantity = 3,
  wip_status = 'Done',
  sort_order = 0
from public.jobs j
where li.job_id = j.id
  and j.id = 'a0000000-0000-4000-8000-000000000204';

update public.line_items li
set
  title = 'Distribution Pole Hardware',
  line_item_number = 'MK-DPH-S1',
  quantity = 2,
  wip_status = 'Done',
  sort_order = 0
from public.jobs j
where li.job_id = j.id
  and j.id = 'a0000000-0000-4000-8000-000000000205';

-- Second line item on crossarm job (multi-item demo)
insert into public.line_items (
  id,
  organization_id,
  job_id,
  title,
  quantity,
  line_item_number,
  wip_status,
  sort_order
)
values (
  'f0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000201',
  'MK-230H Hanger Brackets (Rev D)',
  4,
  'MK-230H-05',
  'To Do',
  1
)
on conflict (id) do nothing;

-- Template checklist sample tasks for the second line item (crossarm template subset)
insert into public.tasks (
  id, organization_id, job_id, line_item_id, title, completed, assignee, due_date, category, sort_order
) values
  ('b0000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000201', 'f0000000-0000-4000-8000-000000000001', 'Review Rev D markup', false, 'Ivy Chen', '2025-07-01', 'Programming', 0),
  ('b0000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000201', 'f0000000-0000-4000-8000-000000000001', 'Cut bracket plate', false, 'Cuong Tran', '2025-07-05', 'Machine', 1),
  ('b0000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000201', 'f0000000-0000-4000-8000-000000000001', 'Fit & weld brackets', false, 'James Nguyen', '2025-07-08', 'Fabrication', 2),
  ('b0000000-0000-4000-8000-000000000021', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000201', 'f0000000-0000-4000-8000-000000000001', 'Dimensional inspection', false, 'Ivy Chen', '2025-07-12', 'Quality Assurance', 3),
  ('b0000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000201', 'f0000000-0000-4000-8000-000000000001', 'Update PO / change order paperwork', false, 'Ivy Chen', '2025-07-02', 'Office', 4),
  ('b0000000-0000-4000-8000-000000000023', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000201', 'f0000000-0000-4000-8000-000000000001', 'Stage for galvanizing pickup', false, 'James Nguyen', '2025-07-14', 'Shipping', 5)
on conflict (id) do nothing;

-- Job-level document (no line item) vs line-item scoped
update public.documents
set line_item_id = null
where id = 'c0000000-0000-4000-8000-000000000003';

update public.documents d
set line_item_id = li.id
from public.line_items li
where d.job_id = li.job_id
  and li.line_item_number = 'MK-230H-01'
  and d.id in (
    'c0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000002',
    'c0000000-0000-4000-8000-000000000004',
    'c0000000-0000-4000-8000-000000000005'
  );
