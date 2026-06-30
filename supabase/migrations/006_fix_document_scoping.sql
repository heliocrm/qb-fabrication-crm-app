-- QB Fabrication CRM — migration 006
-- Fix documents incorrectly bulk-scoped to "General" line item during 005 backfill
-- Run once after 005 if Job-level document filter shows 0 files on seeded jobs

-- Reset all document scopes, then re-apply explicit demo scoping
update public.documents
set line_item_id = null
where line_item_id is not null;

-- Job 201 (BPA crossarm): PO is job-level; drawings/work orders/inspections on primary line item
update public.documents
set line_item_id = (
  select li.id from public.line_items li
  where li.job_id = 'a0000000-0000-4000-8000-000000000201'
    and li.line_item_number = 'MK-230H-01'
  limit 1
)
where id in (
  'c0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000002',
  'c0000000-0000-4000-8000-000000000004',
  'c0000000-0000-4000-8000-000000000005'
);

-- Job 203 (PSE pedestal): spec sheet on line item
update public.documents
set line_item_id = (
  select li.id from public.line_items li
  where li.job_id = 'a0000000-0000-4000-8000-000000000203'
  limit 1
)
where id = 'c0000000-0000-4000-8000-000000000008';

-- Jobs 202, 204, 205: keep documents job-level (line_item_id null)
