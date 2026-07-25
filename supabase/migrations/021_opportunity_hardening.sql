-- QB Fabrication CRM — migration 021
-- Opportunity win/loss reason (owner uses existing assignee_id)
-- Run AFTER 020 in Supabase SQL Editor

alter table public.opportunities
  add column if not exists win_loss_reason text;

comment on column public.opportunities.win_loss_reason is
  'Why Won or Lost — required for terminal stages in the CRM detail UI.';

comment on column public.opportunities.assignee_id is
  'Relationship/pipeline owner (profile). Aligns with contacts.relationship_owner_id pattern.';
