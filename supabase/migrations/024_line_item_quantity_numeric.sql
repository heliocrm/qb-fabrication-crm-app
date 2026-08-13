-- QB Fabrication CRM — migration 024
-- Allow fractional line-item quantities (was int)

alter table public.line_items
  alter column quantity type numeric using quantity::numeric;
