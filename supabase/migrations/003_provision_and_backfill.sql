-- QB Fabrication CRM — migration 003
-- Organization seed, backfill, auto-provision for new sign-ups
-- Run in Supabase SQL Editor AFTER 002

insert into public.organizations (id, name, slug)
values (
  'a0000000-0000-4000-8000-000000000001',
  'QB Fabrication',
  'qb-fabrication'
)
on conflict (slug) do update set name = excluded.name;

update public.accounts
set organization_id = 'a0000000-0000-4000-8000-000000000001'
where organization_id is null;

update public.opportunities
set organization_id = 'a0000000-0000-4000-8000-000000000001'
where organization_id is null;

update public.jobs
set organization_id = 'a0000000-0000-4000-8000-000000000001'
where organization_id is null;

update public.tasks
set organization_id = 'a0000000-0000-4000-8000-000000000001'
where organization_id is null;

update public.documents
set organization_id = 'a0000000-0000-4000-8000-000000000001'
where organization_id is null;

update public.change_orders
set organization_id = 'a0000000-0000-4000-8000-000000000001'
where organization_id is null;

update public.activity_logs
set organization_id = 'a0000000-0000-4000-8000-000000000001'
where organization_id is null;

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

  if exists (select 1 from public.profiles where user_id = auth.uid()) then
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

  insert into public.profiles (user_id, organization_id, full_name, role, avatar_initials)
  values (auth.uid(), org_id, display_name, 'member', initials);

  return org_id;
end;
$$;

grant execute on function public.provision_user_profile() to authenticated;

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (user_id = auth.uid());
