-- QB Fabrication CRM — migration 012
-- Traveler generation audit log
-- Run AFTER 011 in Supabase SQL Editor

create table if not exists public.traveler_generations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  po_number text not null,
  version integer not null check (version > 0),
  customer text,
  order_date text,
  rev_number text,
  structure_numbers text,
  catalog_ids text,
  document_id uuid references public.documents(id) on delete set null,
  generated_by uuid references public.profiles(id) on delete set null,
  generated_at timestamptz not null default now(),
  unique (organization_id, job_id, po_number, version)
);

comment on table public.traveler_generations is
  'Versioned log of Word travelers generated from customer work-order PDFs.';

create index if not exists idx_traveler_gen_job
  on public.traveler_generations (job_id, generated_at desc);

create index if not exists idx_traveler_gen_org_po
  on public.traveler_generations (organization_id, po_number);

alter table public.traveler_generations enable row level security;

create policy "traveler_gen_select"
  on public.traveler_generations for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

create policy "traveler_gen_insert"
  on public.traveler_generations for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
    and public.current_user_role() in ('admin', 'manager', 'member')
  );

grant select, insert on public.traveler_generations to authenticated;
