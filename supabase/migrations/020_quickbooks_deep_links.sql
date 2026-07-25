-- QB Fabrication CRM — migration 020
-- Thin QuickBooks deep links (read-only pointers). No financial sync model.
-- Run AFTER 019 in Supabase SQL Editor

alter table public.accounts
  add column if not exists qb_customer_url text;

alter table public.accounts
  add column if not exists qb_customer_id text;

alter table public.accounts
  add column if not exists qb_status_note text;

comment on column public.accounts.qb_customer_url is
  'Deep link to QuickBooks Online customer (truth lives in QB).';

comment on column public.accounts.qb_customer_id is
  'Optional QBO customer/nameId for display or URL construction.';

comment on column public.accounts.qb_status_note is
  'Optional short chip label (e.g. last invoice / open balance note). Manual — not synced.';

alter table public.jobs
  add column if not exists qb_url text;

alter table public.jobs
  add column if not exists qb_external_id text;

comment on column public.jobs.qb_url is
  'Deep link to QuickBooks job/estimate/invoice. Optional.';

comment on column public.jobs.qb_external_id is
  'Optional QuickBooks external id for display.';
