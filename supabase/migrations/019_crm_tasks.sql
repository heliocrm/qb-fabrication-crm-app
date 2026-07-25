-- QB Fabrication CRM — migration 019
-- CRM follow-ups (sales/relationship). Distinct from public.tasks (shop WIP).
-- Run AFTER 018 in Supabase SQL Editor

create table if not exists public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  body text,
  due_at timestamptz,
  completed_at timestamptz,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  created_by uuid references public.profiles(id) on delete set null,
  account_id uuid references public.accounts(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_tasks_target_check check (
    account_id is not null
    or contact_id is not null
    or opportunity_id is not null
    or job_id is not null
  )
);

comment on table public.crm_tasks is
  'Sales/relationship follow-ups (CRM). Distinct from public.tasks (shop WIP checklists on line items).';

comment on column public.crm_tasks.owner_id is
  'Profile responsible for the follow-up; align with contacts.relationship_owner_id for My queue coherence.';

create index if not exists idx_crm_tasks_owner_due
  on public.crm_tasks (organization_id, owner_id, due_at);

create index if not exists idx_crm_tasks_account
  on public.crm_tasks (account_id)
  where account_id is not null;

create index if not exists idx_crm_tasks_contact
  on public.crm_tasks (contact_id)
  where contact_id is not null;

create index if not exists idx_crm_tasks_open
  on public.crm_tasks (organization_id, completed_at)
  where completed_at is null;

drop trigger if exists set_crm_tasks_updated_at on public.crm_tasks;
create trigger set_crm_tasks_updated_at
  before update on public.crm_tasks
  for each row execute function public.set_updated_at();

alter table public.crm_tasks enable row level security;

create policy "crm_tasks_tenant_select"
  on public.crm_tasks for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

create policy "crm_tasks_tenant_insert"
  on public.crm_tasks for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

create policy "crm_tasks_tenant_update"
  on public.crm_tasks for update to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  )
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

create policy "crm_tasks_tenant_delete"
  on public.crm_tasks for delete to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );
