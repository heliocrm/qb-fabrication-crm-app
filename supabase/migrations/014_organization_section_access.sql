-- QB Fabrication CRM — migration 014
-- Org-level role → section visibility overrides
-- Run AFTER 013 in Supabase SQL Editor

create table if not exists public.organization_section_access (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  section_key text not null,
  role text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, section_key, role),
  constraint organization_section_access_role_check
    check (role in ('admin', 'manager', 'member', 'viewer'))
);

comment on table public.organization_section_access is
  'Per-org overrides for which roles can see configurable main-menu sections. Missing rows use code registry defaults.';

create index if not exists idx_org_section_access_org
  on public.organization_section_access (organization_id);

alter table public.organization_section_access enable row level security;

create policy "org_section_access_select"
  on public.organization_section_access for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
  );

create policy "org_section_access_insert"
  on public.organization_section_access for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
    and public.user_is_admin()
  );

create policy "org_section_access_update"
  on public.organization_section_access for update to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
    and public.user_is_admin()
  )
  with check (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
    and public.user_is_admin()
  );

create policy "org_section_access_delete"
  on public.organization_section_access for delete to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_user_is_active()
    and public.user_is_admin()
  );

grant select, insert, update, delete on public.organization_section_access to authenticated;
