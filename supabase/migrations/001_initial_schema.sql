-- QB Fabrication CRM — initial schema
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/wkutsmgonkawgbidinwx/sql

-- Accounts (customers)
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  contact text,
  email text,
  phone text,
  city text,
  state text,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Opportunities
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete set null,
  title text not null,
  value numeric(12, 2) not null default 0,
  stage text not null default 'Prospecting',
  probability int not null default 0 check (probability between 0 and 100),
  close_date date,
  assignee text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Jobs
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  job_number text not null unique,
  po_number text not null,
  description text not null,
  status text not null default 'To Do',
  priority text not null default 'Normal',
  delivery_date date,
  start_date date,
  tonnage numeric(10, 2),
  value numeric(12, 2) not null default 0,
  mark_numbers text[] default '{}',
  assignees text[] default '{}',
  progress int not null default 0 check (progress between 0 and 100),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  assignee text,
  due_date date,
  category text not null default 'Fabrication',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Documents
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  name text not null,
  type text not null,
  storage_path text,
  size_bytes bigint,
  uploaded_by text,
  created_at timestamptz not null default now()
);

-- Change orders
create table if not exists public.change_orders (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  type text not null,
  description text not null,
  impact text,
  status text not null default 'Open',
  value numeric(12, 2),
  created_at timestamptz not null default now()
);

-- Row Level Security (authenticated users only)
alter table public.accounts enable row level security;
alter table public.opportunities enable row level security;
alter table public.jobs enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.change_orders enable row level security;

create policy "Authenticated users can read accounts"
  on public.accounts for select to authenticated using (true);

create policy "Authenticated users can manage accounts"
  on public.accounts for all to authenticated using (true) with check (true);

create policy "Authenticated users can read opportunities"
  on public.opportunities for select to authenticated using (true);

create policy "Authenticated users can manage opportunities"
  on public.opportunities for all to authenticated using (true) with check (true);

create policy "Authenticated users can read jobs"
  on public.jobs for select to authenticated using (true);

create policy "Authenticated users can manage jobs"
  on public.jobs for all to authenticated using (true) with check (true);

create policy "Authenticated users can read tasks"
  on public.tasks for select to authenticated using (true);

create policy "Authenticated users can manage tasks"
  on public.tasks for all to authenticated using (true) with check (true);

create policy "Authenticated users can read documents"
  on public.documents for select to authenticated using (true);

create policy "Authenticated users can manage documents"
  on public.documents for all to authenticated using (true) with check (true);

create policy "Authenticated users can read change_orders"
  on public.change_orders for select to authenticated using (true);

create policy "Authenticated users can manage change_orders"
  on public.change_orders for all to authenticated using (true) with check (true);
