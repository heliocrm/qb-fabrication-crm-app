-- Drawing packet crop templates + packet audit
-- Run AFTER 021 in Supabase SQL Editor.

create table if not exists public.drawing_crop_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  crop_x0 double precision not null,
  crop_y0 double precision not null,
  crop_x1 double precision not null,
  crop_y1 double precision not null,
  margin_side text not null default 'left' check (margin_side in ('left', 'right')),
  margin_left double precision not null default 38,
  margin_right double precision not null default 38,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

comment on table public.drawing_crop_templates is
  'Named proportional crop + margin presets for drawing packet stamping (Trevor crop templates).';

create index if not exists idx_drawing_crop_templates_org
  on public.drawing_crop_templates (organization_id, name);

create table if not exists public.drawing_packets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  traveler_id uuid references public.travelers(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  po_number text,
  rev_number text,
  page_count integer,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.drawing_packets is
  'Audit log of stamped drawing packets saved to Drive.';

create index if not exists idx_drawing_packets_job
  on public.drawing_packets (job_id, created_at desc);

alter table public.drawing_crop_templates enable row level security;
alter table public.drawing_packets enable row level security;

create policy "drawing_crop_templates_select"
  on public.drawing_crop_templates for select to authenticated
  using (organization_id = public.current_organization_id());

create policy "drawing_crop_templates_insert"
  on public.drawing_crop_templates for insert to authenticated
  with check (organization_id = public.current_organization_id());

create policy "drawing_crop_templates_update"
  on public.drawing_crop_templates for update to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy "drawing_crop_templates_delete"
  on public.drawing_crop_templates for delete to authenticated
  using (organization_id = public.current_organization_id());

create policy "drawing_packets_select"
  on public.drawing_packets for select to authenticated
  using (organization_id = public.current_organization_id());

create policy "drawing_packets_insert"
  on public.drawing_packets for insert to authenticated
  with check (organization_id = public.current_organization_id());

grant select, insert, update, delete on public.drawing_crop_templates to authenticated;
grant select, insert on public.drawing_packets to authenticated;
