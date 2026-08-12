-- QB Fabrication CRM — migration 023
-- Trello import/refresh idempotency keys (board → job, card → line item, checkitem → task)

alter table public.jobs
  add column if not exists trello_board_id text;

comment on column public.jobs.trello_board_id is
  'Trello board id when this job was imported/synced from Trello (one board ≈ one job).';

alter table public.line_items
  add column if not exists trello_card_id text;

comment on column public.line_items.trello_card_id is
  'Trello card id when this line item was imported/synced from Trello.';

alter table public.tasks
  add column if not exists trello_checkitem_id text;

comment on column public.tasks.trello_checkitem_id is
  'Trello checklist item id when this task was imported/synced from Trello.';

create unique index if not exists jobs_org_trello_board_id_uidx
  on public.jobs (organization_id, trello_board_id)
  where trello_board_id is not null;

create unique index if not exists line_items_org_trello_card_id_uidx
  on public.line_items (organization_id, trello_card_id)
  where trello_card_id is not null;

create unique index if not exists tasks_org_trello_checkitem_id_uidx
  on public.tasks (organization_id, trello_checkitem_id)
  where trello_checkitem_id is not null;
