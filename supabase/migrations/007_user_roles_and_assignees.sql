-- QB Fabrication CRM — migration 007
-- Role-based access, job_assignees junction, RLS helpers
-- Run AFTER 006 in Supabase SQL Editor

-- ─── 1a. Profiles: is_active + role normalization ─────────────────────────

alter table public.profiles
  add column if not exists is_active boolean not null default true;

update public.profiles set role = 'admin' where role = 'owner';

-- Bootstrap first admin if none exists (QB Fabrication org)
update public.profiles
set role = 'admin'
where id = (
  select id from public.profiles
  where organization_id = 'a0000000-0000-4000-8000-000000000001'
  order by created_at asc
  limit 1
)
and not exists (
  select 1 from public.profiles
  where role = 'admin'
    and organization_id = 'a0000000-0000-4000-8000-000000000001'
);

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'manager', 'member', 'viewer'));

comment on column public.profiles.is_active is
  'When false, user cannot access tenant data (deactivated by admin).';

-- ─── 1b. job_assignees junction ─────────────────────────────────────────────

create table if not exists public.job_assignees (
  job_id uuid not null references public.jobs(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles(id) on delete set null,
  primary key (job_id, profile_id)
);

comment on table public.job_assignees is
  'Links CRM profiles to jobs for member-scoped access. Replaces jobs.assignees text[].';

create index if not exists idx_job_assignees_profile_id on public.job_assignees(profile_id);
create index if not exists idx_job_assignees_job_id on public.job_assignees(job_id);

-- ─── 1c. Backfill from legacy jobs.assignees text[] ─────────────────────────

insert into public.job_assignees (job_id, profile_id)
select j.id, p.id
from public.jobs j
cross join lateral unnest(j.assignees) as name(text)
join public.profiles p
  on p.organization_id = j.organization_id
 and lower(trim(p.full_name)) = lower(trim(name))
on conflict do nothing;

-- ─── 1d. RLS helper functions ───────────────────────────────────────────────

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.profiles p
  where p.user_id = auth.uid()
    and p.is_active = true
  limit 1;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.user_id = auth.uid()
    and p.is_active = true
  limit 1;
$$;

create or replace function public.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_active from public.profiles p where p.user_id = auth.uid() limit 1),
    false
  );
$$;

create or replace function public.user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin'
    and public.current_user_is_active();
$$;

create or replace function public.user_is_manager_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'manager')
    and public.current_user_is_active();
$$;

create or replace function public.user_can_read_job(target_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.jobs j
    where j.id = target_job_id
      and j.organization_id = public.current_organization_id()
      and public.current_user_is_active()
      and (
        public.current_user_role() in ('admin', 'manager', 'viewer')
        or exists (
          select 1 from public.job_assignees ja
          where ja.job_id = j.id
            and ja.profile_id = public.current_profile_id()
        )
      )
  );
$$;

create or replace function public.user_can_write_job(target_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.jobs j
    where j.id = target_job_id
      and j.organization_id = public.current_organization_id()
      and public.current_user_is_active()
      and (
        public.current_user_role() in ('admin', 'manager')
        or (
          public.current_user_role() = 'member'
          and exists (
            select 1 from public.job_assignees ja
            where ja.job_id = j.id
              and ja.profile_id = public.current_profile_id()
          )
        )
      )
  );
$$;

grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_is_active() to authenticated;
grant execute on function public.user_is_admin() to authenticated;
grant execute on function public.user_is_manager_or_admin() to authenticated;
grant execute on function public.user_can_read_job(uuid) to authenticated;
grant execute on function public.user_can_write_job(uuid) to authenticated;

-- ─── 1d. Update provision_user_profile ──────────────────────────────────────

create or replace function public.provision_user_profile()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
  display_name text;
  initials text;
  meta jsonb;
  existing_active boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id into org_id
  from public.organizations
  where slug = 'qb-fabrication'
  limit 1;

  if org_id is null then
    raise exception 'QB Fabrication organization not found. Run migration 003.';
  end if;

  select p.is_active into existing_active
  from public.profiles p
  where p.user_id = auth.uid();

  if found then
    if existing_active = false then
      raise exception 'Account deactivated. Contact an administrator.';
    end if;
    return org_id;
  end if;

  meta := coalesce(auth.jwt()->'user_metadata', '{}'::jsonb);

  display_name := coalesce(
    nullif(trim(meta->>'full_name'), ''),
    nullif(trim(meta->>'name'), ''),
    split_part(coalesce(auth.jwt()->>'email', ''), '@', 1),
    'Team Member'
  );

  initials := upper(left(split_part(display_name, ' ', 1), 1))
    || coalesce(upper(left(nullif(split_part(display_name, ' ', 2), ''), 1)), '');

  insert into public.profiles (user_id, organization_id, full_name, role, avatar_initials, is_active)
  values (auth.uid(), org_id, display_name, 'member', initials, true);

  return org_id;
end;
$$;

-- ─── 1e. RLS: job_assignees ─────────────────────────────────────────────────

alter table public.job_assignees enable row level security;

create policy "job_assignees_select"
  on public.job_assignees for select to authenticated
  using (public.user_can_read_job(job_id));

create policy "job_assignees_insert"
  on public.job_assignees for insert to authenticated
  with check (
    public.user_is_manager_or_admin()
    and exists (
      select 1 from public.jobs j
      where j.id = job_id
        and j.organization_id = public.current_organization_id()
    )
    and exists (
      select 1 from public.profiles p
      where p.id = profile_id
        and p.organization_id = public.current_organization_id()
        and p.is_active = true
    )
  );

create policy "job_assignees_delete"
  on public.job_assignees for delete to authenticated
  using (
    public.user_is_manager_or_admin()
    and exists (
      select 1 from public.jobs j
      where j.id = job_id
        and j.organization_id = public.current_organization_id()
    )
  );

grant select, insert, delete on public.job_assignees to authenticated;

-- ─── 1e. RLS: profiles (admin update + restrict self-escalation) ─────────────

drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (user_id = auth.uid() and is_active = true)
  with check (
    user_id = auth.uid()
    and role = (select p.role from public.profiles p where p.user_id = auth.uid())
    and is_active = (select p.is_active from public.profiles p where p.user_id = auth.uid())
  );

create policy "profiles_update_admin"
  on public.profiles for update to authenticated
  using (
    public.user_is_admin()
    and organization_id = public.current_organization_id()
  )
  with check (
    public.user_is_admin()
    and organization_id = public.current_organization_id()
  );

-- ─── 1e. RLS: jobs ──────────────────────────────────────────────────────────

drop policy if exists "jobs_tenant_select" on public.jobs;
drop policy if exists "jobs_tenant_insert" on public.jobs;
drop policy if exists "jobs_tenant_update" on public.jobs;
drop policy if exists "jobs_tenant_delete" on public.jobs;

create policy "jobs_tenant_select"
  on public.jobs for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
    and public.user_can_read_job(id)
  );

create policy "jobs_tenant_insert"
  on public.jobs for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.user_is_manager_or_admin()
  );

create policy "jobs_tenant_update"
  on public.jobs for update to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(id)
  )
  with check (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(id)
  );

create policy "jobs_tenant_delete"
  on public.jobs for delete to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(id)
  );

-- ─── 1e. RLS: line_items ────────────────────────────────────────────────────

drop policy if exists "line_items_tenant_select" on public.line_items;
drop policy if exists "line_items_tenant_insert" on public.line_items;
drop policy if exists "line_items_tenant_update" on public.line_items;
drop policy if exists "line_items_tenant_delete" on public.line_items;

create policy "line_items_tenant_select"
  on public.line_items for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_can_read_job(job_id)
  );

create policy "line_items_tenant_insert"
  on public.line_items for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(job_id)
  );

create policy "line_items_tenant_update"
  on public.line_items for update to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(job_id)
  )
  with check (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(job_id)
  );

create policy "line_items_tenant_delete"
  on public.line_items for delete to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(job_id)
  );

-- ─── 1e. RLS: tasks ─────────────────────────────────────────────────────────

drop policy if exists "tasks_tenant_select" on public.tasks;
drop policy if exists "tasks_tenant_insert" on public.tasks;
drop policy if exists "tasks_tenant_update" on public.tasks;
drop policy if exists "tasks_tenant_delete" on public.tasks;

create policy "tasks_tenant_select"
  on public.tasks for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_can_read_job(job_id)
  );

create policy "tasks_tenant_insert"
  on public.tasks for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(job_id)
    and exists (
      select 1 from public.line_items li
      where li.id = line_item_id
        and li.job_id = job_id
        and li.organization_id = public.current_organization_id()
    )
  );

create policy "tasks_tenant_update"
  on public.tasks for update to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(job_id)
  )
  with check (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(job_id)
  );

create policy "tasks_tenant_delete"
  on public.tasks for delete to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(job_id)
  );

-- ─── 1e. RLS: documents ─────────────────────────────────────────────────────

drop policy if exists "documents_tenant_select" on public.documents;
drop policy if exists "documents_tenant_insert" on public.documents;
drop policy if exists "documents_tenant_update" on public.documents;
drop policy if exists "documents_tenant_delete" on public.documents;

create policy "documents_tenant_select"
  on public.documents for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_can_read_job(job_id)
  );

create policy "documents_tenant_insert"
  on public.documents for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(job_id)
  );

create policy "documents_tenant_update"
  on public.documents for update to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(job_id)
  )
  with check (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(job_id)
  );

create policy "documents_tenant_delete"
  on public.documents for delete to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(job_id)
  );

-- ─── 1e. RLS: change_orders ─────────────────────────────────────────────────

drop policy if exists "change_orders_tenant_select" on public.change_orders;
drop policy if exists "change_orders_tenant_insert" on public.change_orders;
drop policy if exists "change_orders_tenant_update" on public.change_orders;
drop policy if exists "change_orders_tenant_delete" on public.change_orders;

create policy "change_orders_tenant_select"
  on public.change_orders for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_can_read_job(job_id)
  );

create policy "change_orders_tenant_insert"
  on public.change_orders for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(job_id)
  );

create policy "change_orders_tenant_update"
  on public.change_orders for update to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(job_id)
  )
  with check (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(job_id)
  );

create policy "change_orders_tenant_delete"
  on public.change_orders for delete to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(job_id)
  );

-- ─── 1e. RLS: activity_logs ─────────────────────────────────────────────────

drop policy if exists "activity_logs_tenant_select" on public.activity_logs;
drop policy if exists "activity_logs_tenant_insert" on public.activity_logs;

create policy "activity_logs_tenant_select"
  on public.activity_logs for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_can_read_job(job_id)
  );

create policy "activity_logs_tenant_insert"
  on public.activity_logs for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.user_can_write_job(job_id)
  );

-- ─── 1e. RLS: accounts + opportunities (read all, write admin/manager) ──────

drop policy if exists "accounts_tenant_insert" on public.accounts;
drop policy if exists "accounts_tenant_update" on public.accounts;
drop policy if exists "accounts_tenant_delete" on public.accounts;

create policy "accounts_tenant_insert"
  on public.accounts for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.user_is_manager_or_admin()
  );

create policy "accounts_tenant_update"
  on public.accounts for update to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_is_manager_or_admin()
  )
  with check (
    organization_id = public.current_organization_id()
    and public.user_is_manager_or_admin()
  );

create policy "accounts_tenant_delete"
  on public.accounts for delete to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_is_manager_or_admin()
  );

drop policy if exists "opportunities_tenant_insert" on public.opportunities;
drop policy if exists "opportunities_tenant_update" on public.opportunities;
drop policy if exists "opportunities_tenant_delete" on public.opportunities;

create policy "opportunities_tenant_insert"
  on public.opportunities for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.user_is_manager_or_admin()
  );

create policy "opportunities_tenant_update"
  on public.opportunities for update to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_is_manager_or_admin()
  )
  with check (
    organization_id = public.current_organization_id()
    and public.user_is_manager_or_admin()
  );

create policy "opportunities_tenant_delete"
  on public.opportunities for delete to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.user_is_manager_or_admin()
  );

-- Require active users for account/opportunity SELECT
drop policy if exists "accounts_tenant_select" on public.accounts;
drop policy if exists "opportunities_tenant_select" on public.opportunities;

create policy "accounts_tenant_select"
  on public.accounts for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

create policy "opportunities_tenant_select"
  on public.opportunities for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

-- Profiles select requires active (deactivated users cannot browse org)
drop policy if exists "profiles_select_org" on public.profiles;

create policy "profiles_select_org"
  on public.profiles for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );
