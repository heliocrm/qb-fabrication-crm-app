-- QB Fabrication CRM — migration 002
-- Multi-tenant org model, Google Drive document fields, indexes, RLS
-- Run AFTER 001_initial_schema.sql in Supabase SQL Editor
-- https://supabase.com/dashboard/project/wkutsmgonkawgbidinwx/sql

-- ─── Extensions ─────────────────────────────────────────────────────────────
create extension if not exists "pg_trgm";

-- ─── Organizations (tenant / company) ───────────────────────────────────────
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.organizations is
  'Tenant root — each QB Fabrication company (or subsidiary) is one organization.';

-- ─── Profiles — links auth.users → organization ─────────────────────────────
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'manager', 'member', 'viewer')),
  avatar_initials text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Maps Supabase Auth users to an organization. RLS uses this for multi-tenant isolation.';

-- Helper: current user''s organization (used in RLS policies)
create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.profiles
  where user_id = auth.uid()
  limit 1;
$$;

comment on function public.current_organization_id() is
  'Returns the organization_id for the authenticated user. Used in all tenant-scoped RLS policies.';

-- ─── Add organization_id to existing tables (safe if already present) ───────
alter table public.accounts
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.opportunities
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.jobs
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.jobs
  add column if not exists google_drive_folder_id text;

alter table public.tasks
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.tasks
  add column if not exists assignee_id uuid,
  add column if not exists updated_at timestamptz not null default now();

alter table public.documents
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.change_orders
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

-- Rename / add document Google Drive columns
alter table public.documents
  add column if not exists mime_type text,
  add column if not exists google_drive_file_id text,
  add column if not exists google_drive_folder_id text,
  add column if not exists web_view_link text,
  add column if not exists preview_enabled boolean not null default false,
  add column if not exists uploaded_by_id uuid,
  add column if not exists updated_at timestamptz not null default now();

-- Change orders: rename implicit date → occurred_on if needed
alter table public.change_orders
  add column if not exists occurred_on date not null default current_date,
  add column if not exists created_by text,
  add column if not exists updated_at timestamptz not null default now();

-- Opportunities extras
alter table public.opportunities
  add column if not exists assignee_id uuid;

-- ─── Activity log ───────────────────────────────────────────────────────────
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  user_name text not null,
  user_avatar text,
  action text not null,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

comment on table public.activity_logs is
  'Append-only audit trail per job. Scoped to organization via RLS.';

-- ─── updated_at trigger ─────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'organizations', 'profiles', 'accounts', 'opportunities', 'jobs',
    'tasks', 'documents', 'change_orders'
  ]
  loop
    execute format('
      drop trigger if exists set_%I_updated_at on public.%I;
      create trigger set_%I_updated_at
        before update on public.%I
        for each row execute function public.set_updated_at();
    ', t, t, t, t);
  end loop;
end;
$$;

-- ─── Indexes ────────────────────────────────────────────────────────────────
-- Jobs: PO lookup, status boards, delivery scheduling
create index if not exists idx_jobs_organization_id on public.jobs(organization_id);
create index if not exists idx_jobs_po_number on public.jobs(po_number);
create index if not exists idx_jobs_po_number_trgm on public.jobs using gin (po_number gin_trgm_ops);
create index if not exists idx_jobs_status on public.jobs(status);
create index if not exists idx_jobs_delivery_date on public.jobs(delivery_date);
create index if not exists idx_jobs_account_id on public.jobs(account_id);
create index if not exists idx_jobs_priority on public.jobs(priority);
create index if not exists idx_jobs_org_status on public.jobs(organization_id, status);
create index if not exists idx_jobs_org_delivery on public.jobs(organization_id, delivery_date);

-- Tasks: job checklist ordering
create index if not exists idx_tasks_job_id on public.tasks(job_id);
create index if not exists idx_tasks_organization_id on public.tasks(organization_id);
create index if not exists idx_tasks_job_sort on public.tasks(job_id, sort_order);

-- Documents: Drive file lookup
create index if not exists idx_documents_job_id on public.documents(job_id);
create index if not exists idx_documents_organization_id on public.documents(organization_id);
create index if not exists idx_documents_drive_file on public.documents(google_drive_file_id)
  where google_drive_file_id is not null;

-- Change orders & activity
create index if not exists idx_change_orders_job_id on public.change_orders(job_id);
create index if not exists idx_change_orders_organization_id on public.change_orders(organization_id);
create index if not exists idx_activity_logs_job_id on public.activity_logs(job_id);
create index if not exists idx_activity_logs_organization_id on public.activity_logs(organization_id);

-- Opportunities pipeline
create index if not exists idx_opportunities_organization_id on public.opportunities(organization_id);
create index if not exists idx_opportunities_stage on public.opportunities(stage);
create index if not exists idx_opportunities_org_stage on public.opportunities(organization_id, stage);

-- Profiles
create index if not exists idx_profiles_organization_id on public.profiles(organization_id);
create index if not exists idx_profiles_user_id on public.profiles(user_id);

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- MULTI-TENANT RULE: authenticated users may only access rows where
-- organization_id matches their profile''s organization.
-- Service role bypasses RLS for admin/seed scripts.

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.activity_logs enable row level security;

-- Drop permissive policies from migration 001 (if they exist)
drop policy if exists "Authenticated users can read accounts" on public.accounts;
drop policy if exists "Authenticated users can manage accounts" on public.accounts;
drop policy if exists "Authenticated users can read opportunities" on public.opportunities;
drop policy if exists "Authenticated users can manage opportunities" on public.opportunities;
drop policy if exists "Authenticated users can read jobs" on public.jobs;
drop policy if exists "Authenticated users can manage jobs" on public.jobs;
drop policy if exists "Authenticated users can read tasks" on public.tasks;
drop policy if exists "Authenticated users can manage tasks" on public.tasks;
drop policy if exists "Authenticated users can read documents" on public.documents;
drop policy if exists "Authenticated users can manage documents" on public.documents;
drop policy if exists "Authenticated users can read change_orders" on public.change_orders;
drop policy if exists "Authenticated users can manage change_orders" on public.change_orders;

-- Organizations: users see only their own org
create policy "org_select_own"
  on public.organizations for select to authenticated
  using (id = public.current_organization_id());

-- Profiles: users see profiles in their org; update own profile only
create policy "profiles_select_org"
  on public.profiles for select to authenticated
  using (organization_id = public.current_organization_id());

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Macro pattern for tenant-scoped tables
-- ACCOUNTS
create policy "accounts_tenant_select"
  on public.accounts for select to authenticated
  using (organization_id = public.current_organization_id());

create policy "accounts_tenant_insert"
  on public.accounts for insert to authenticated
  with check (organization_id = public.current_organization_id());

create policy "accounts_tenant_update"
  on public.accounts for update to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy "accounts_tenant_delete"
  on public.accounts for delete to authenticated
  using (organization_id = public.current_organization_id());

-- OPPORTUNITIES
create policy "opportunities_tenant_select"
  on public.opportunities for select to authenticated
  using (organization_id = public.current_organization_id());

create policy "opportunities_tenant_insert"
  on public.opportunities for insert to authenticated
  with check (organization_id = public.current_organization_id());

create policy "opportunities_tenant_update"
  on public.opportunities for update to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy "opportunities_tenant_delete"
  on public.opportunities for delete to authenticated
  using (organization_id = public.current_organization_id());

-- JOBS
create policy "jobs_tenant_select"
  on public.jobs for select to authenticated
  using (organization_id = public.current_organization_id());

create policy "jobs_tenant_insert"
  on public.jobs for insert to authenticated
  with check (organization_id = public.current_organization_id());

create policy "jobs_tenant_update"
  on public.jobs for update to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy "jobs_tenant_delete"
  on public.jobs for delete to authenticated
  using (organization_id = public.current_organization_id());

-- TASKS (also verify parent job belongs to tenant)
create policy "tasks_tenant_select"
  on public.tasks for select to authenticated
  using (organization_id = public.current_organization_id());

create policy "tasks_tenant_insert"
  on public.tasks for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and exists (
      select 1 from public.jobs j
      where j.id = job_id and j.organization_id = public.current_organization_id()
    )
  );

create policy "tasks_tenant_update"
  on public.tasks for update to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy "tasks_tenant_delete"
  on public.tasks for delete to authenticated
  using (organization_id = public.current_organization_id());

-- DOCUMENTS
create policy "documents_tenant_select"
  on public.documents for select to authenticated
  using (organization_id = public.current_organization_id());

create policy "documents_tenant_insert"
  on public.documents for insert to authenticated
  with check (organization_id = public.current_organization_id());

create policy "documents_tenant_update"
  on public.documents for update to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy "documents_tenant_delete"
  on public.documents for delete to authenticated
  using (organization_id = public.current_organization_id());

-- CHANGE ORDERS
create policy "change_orders_tenant_select"
  on public.change_orders for select to authenticated
  using (organization_id = public.current_organization_id());

create policy "change_orders_tenant_insert"
  on public.change_orders for insert to authenticated
  with check (organization_id = public.current_organization_id());

create policy "change_orders_tenant_update"
  on public.change_orders for update to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy "change_orders_tenant_delete"
  on public.change_orders for delete to authenticated
  using (organization_id = public.current_organization_id());

-- ACTIVITY LOGS (insert-only for members; no delete from client)
create policy "activity_logs_tenant_select"
  on public.activity_logs for select to authenticated
  using (organization_id = public.current_organization_id());

create policy "activity_logs_tenant_insert"
  on public.activity_logs for insert to authenticated
  with check (organization_id = public.current_organization_id());

-- ─── Auto-create profile on signup (optional hook) ──────────────────────────
-- Uncomment and customize after creating your first organization manually:
--
-- create or replace function public.handle_new_user()
-- returns trigger language plpgsql security definer set search_path = public as $$
-- begin
--   insert into public.profiles (user_id, organization_id, full_name, avatar_initials)
--   values (
--     new.id,
--     '<YOUR-ORG-UUID>',
--     coalesce(new.raw_user_meta_data->>'full_name', new.email),
--     upper(left(coalesce(new.raw_user_meta_data->>'full_name', new.email), 2))
--   );
--   return new;
-- end;
-- $$;
--
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute function public.handle_new_user();
