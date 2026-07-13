-- QB Fabrication CRM — migration 008
-- Profile personalization (avatar, notifications) + saved report views + avatars storage
-- Run AFTER 007 in Supabase SQL Editor

-- ─── 1. Profiles extensions ─────────────────────────────────────────────────

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists notification_preferences jsonb not null default '{"job_updates_email":true,"task_assignments_email":true}'::jsonb;

comment on column public.profiles.avatar_url is
  'Public URL for user avatar image (Supabase Storage avatars bucket).';
comment on column public.profiles.notification_preferences is
  'User notification toggles: job_updates_email, task_assignments_email.';

-- ─── 2. Saved report views ──────────────────────────────────────────────────

create table if not exists public.report_views (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_report_views_profile_id on public.report_views(profile_id);
create index if not exists idx_report_views_org_id on public.report_views(organization_id);

comment on table public.report_views is
  'Per-user saved filter combinations for the Reports BI layer.';

-- ─── 3. RLS: report_views ───────────────────────────────────────────────────

alter table public.report_views enable row level security;

create policy "report_views_select"
  on public.report_views for select to authenticated
  using (
    profile_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  );

create policy "report_views_insert"
  on public.report_views for insert to authenticated
  with check (
    profile_id in (
      select id from public.profiles where user_id = auth.uid()
    )
    and organization_id in (
      select organization_id from public.profiles where user_id = auth.uid()
    )
  );

create policy "report_views_update"
  on public.report_views for update to authenticated
  using (
    profile_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  )
  with check (
    profile_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  );

create policy "report_views_delete"
  on public.report_views for delete to authenticated
  using (
    profile_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.report_views to authenticated;

-- ─── 4. Avatars storage bucket ──────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Public read
create policy "avatars_public_read"
  on storage.objects for select to public
  using (bucket_id = 'avatars');

-- Users manage their own folder: avatars/{user_id}/*
create policy "avatars_user_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_user_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_user_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
