-- QB Fabrication CRM — migration 009
-- Harden report_views user isolation (run after 008)
-- Ensures saved views remain strictly per-profile even for table owners / future roles

-- Force RLS so policies always apply
alter table public.report_views force row level security;

-- Optional uniqueness: one name per user (case-insensitive)
create unique index if not exists idx_report_views_profile_name_unique
  on public.report_views (profile_id, lower(name));

comment on index public.idx_report_views_profile_name_unique is
  'Each user can only have one saved report view per name.';
