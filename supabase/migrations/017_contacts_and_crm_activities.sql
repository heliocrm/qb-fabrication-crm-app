-- QB Fabrication CRM — migration 017
-- Contacts under accounts + manual CRM activity timeline
-- Run AFTER 016 in Supabase SQL Editor

-- ─── Contacts ───────────────────────────────────────────────────────────────
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  full_name text not null,
  role_title text,
  email text,
  phone text,
  preferred_channel text,
  personal_notes text,
  relationship_owner_id uuid references public.profiles(id) on delete set null,
  last_contact_at timestamptz,
  next_touch_at timestamptz,
  next_touch_owner_id uuid references public.profiles(id) on delete set null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.contacts is
  'People at customer accounts — relationship notes and next-touch planning.';

create index if not exists idx_contacts_org_account
  on public.contacts (organization_id, account_id);

create index if not exists idx_contacts_org_next_touch
  on public.contacts (organization_id, next_touch_at);

drop trigger if exists set_contacts_updated_at on public.contacts;
create trigger set_contacts_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

alter table public.contacts enable row level security;

create policy "contacts_tenant_select"
  on public.contacts for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

create policy "contacts_tenant_insert"
  on public.contacts for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

create policy "contacts_tenant_update"
  on public.contacts for update to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  )
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

create policy "contacts_tenant_delete"
  on public.contacts for delete to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

-- ─── CRM activities (manual notes / touches; Google sync later) ─────────────
create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  kind text not null default 'note'
    check (kind in ('note', 'call', 'meeting', 'touch')),
  body text not null,
  occurred_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint crm_activities_target_check check (
    contact_id is not null or job_id is not null or account_id is not null
  )
);

comment on table public.crm_activities is
  'Manual relationship activity (notes/calls/meetings). System job audit stays in activity_logs.';

create index if not exists idx_crm_activities_contact
  on public.crm_activities (contact_id, occurred_at desc);

create index if not exists idx_crm_activities_job
  on public.crm_activities (job_id, occurred_at desc);

create index if not exists idx_crm_activities_account
  on public.crm_activities (account_id, occurred_at desc);

create index if not exists idx_crm_activities_org_occurred
  on public.crm_activities (organization_id, occurred_at desc);

alter table public.crm_activities enable row level security;

create policy "crm_activities_tenant_select"
  on public.crm_activities for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

create policy "crm_activities_tenant_insert"
  on public.crm_activities for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

create policy "crm_activities_tenant_update"
  on public.crm_activities for update to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  )
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

create policy "crm_activities_tenant_delete"
  on public.crm_activities for delete to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );
