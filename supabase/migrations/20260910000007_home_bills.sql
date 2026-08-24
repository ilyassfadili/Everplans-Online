-- Home Planner (Product #4) - Household Bills (Everplans Home Planner
-- Prompt 4 Phase 1: "What household expenses do I have, and what is
-- coming up?").
--
-- `public.home_bills` is a child table of `public.homes`, the same shape
-- `home_rooms`/`home_inventory_items`/`home_maintenance_tasks` already
-- establish. Recurrence reuses the *exact same column shape*
-- `home_maintenance_tasks` introduced in
-- `20260910000006_home_maintenance_recurrence.sql` (`recurrence_frequency`/
-- `recurrence_interval_days`/`recurrence_active`/`series_root_id`) and the
-- same date-math (`@/lib/home-planner/recurrence`, already
-- table-agnostic) - Phase 1's own instruction: "do not create a separate
-- recurrence engine if the existing Home Planner maintenance recurrence
-- architecture can safely be reused." `recurrence_frequency` doubles as
-- the bill's own "frequency" - `null` means a one-time bill, not a
-- missing field.
--
-- Deliberately no stored `status` column, same reasoning
-- `home_maintenance_tasks` documents: "Upcoming / Due / Paid / Overdue" is
-- derived at read time from `paid_at`/`due_date`
-- (`@/lib/home-planner/bill-status.ts`'s `calculateBillStatus`), so it can
-- never drift out of sync with the dates it summarizes. `paid_at` is the
-- one real, stored fact: `null` means unpaid, a timestamp means paid at
-- that time - the bill's counterpart to `home_maintenance_tasks.completed_at`.
--
-- This is a planning/tracking system, not payment processing (Phase 1's
-- own scope boundary) - "paid" here just means "marked paid by the user,"
-- nothing more.
create table if not exists public.home_bills (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  name text not null,
  category text not null default 'other',
  amount_cents integer not null,
  due_date date,
  notes text,
  paid_at timestamptz,
  recurrence_frequency text,
  recurrence_interval_days integer,
  recurrence_active boolean not null default true,
  series_root_id uuid references public.home_bills (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint home_bills_name_length check (char_length(name) between 1 and 150),
  constraint home_bills_category_valid check (
    category in ('electricity', 'water', 'gas', 'internet', 'phone', 'insurance', 'rent', 'mortgage', 'subscription', 'property-services', 'other')
  ),
  constraint home_bills_amount_valid check (amount_cents >= 0),
  constraint home_bills_notes_length check (notes is null or char_length(notes) <= 2000),
  constraint home_bills_recurrence_frequency_valid check (
    recurrence_frequency is null or recurrence_frequency in ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom')
  ),
  constraint home_bills_recurrence_interval_valid check (
    recurrence_interval_days is null or recurrence_interval_days between 1 and 3650
  ),
  constraint home_bills_custom_interval_required check (
    recurrence_frequency is distinct from 'custom' or recurrence_interval_days is not null
  )
);

create index if not exists home_bills_home_id_idx on public.home_bills (home_id);
create index if not exists home_bills_series_root_id_idx on public.home_bills (series_root_id);

-- Same duplicate-occurrence guarantee `home_maintenance_tasks_series_one_open_idx`
-- establishes: at most one open (unpaid) occurrence per recurring series.
create unique index if not exists home_bills_series_one_open_idx
  on public.home_bills (coalesce(series_root_id, id))
  where paid_at is null and recurrence_frequency is not null;

alter table public.home_bills enable row level security;

create policy "Users can manage their own bills" on public.home_bills
  for all to authenticated
  using (exists (select 1 from public.homes h where h.id = home_bills.home_id and h.owner_id = auth.uid()))
  with check (exists (select 1 from public.homes h where h.id = home_bills.home_id and h.owner_id = auth.uid()));

create function public.set_home_bills_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_home_bills_updated
  before update on public.home_bills
  for each row
  execute function public.set_home_bills_updated_at();
