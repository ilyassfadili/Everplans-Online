-- Travel Planner (Product #3) - budget foundation (Prompt 3 Phase 1).
--
-- `total_budget_cents`/`currency` are added directly onto `public.trips`
-- (an `alter table`, not a new root table) - the same "the workspace's own
-- top-level settings live on the workspace row itself" shape
-- `weddings.currency` and `budget_plans.name`/`period_type` already
-- establish; Travel Planner's trip already *is* the workspace root (no
-- separate "budget plan" entity the way Budget Planner has one, since a
-- trip only ever has one budget). Money is always integer cents, per this
-- repo's own universal convention - never a float.
alter table public.trips
  add column if not exists total_budget_cents integer not null default 0,
  add column if not exists currency text not null default 'USD';

alter table public.trips
  add constraint trips_total_budget_non_negative check (total_budget_cents >= 0);

-- `public.trip_budget_categories` - a child of `trips`, same shape as
-- `wedding_budget_categories`: free-text, user-created category names
-- (not a closed `check` list - unlike `trip_type`/`trip_activities.category`,
-- a budget category genuinely varies per traveler, so there's nothing
-- meaningful to curate into a fixed list), each with its own planned
-- amount. "Total planned budget" (Phase 1 §6) is `trips.total_budget_cents`
-- itself; "planned category amounts" are these rows; "remaining/unallocated"
-- is `total_budget_cents` minus the sum of these rows' `planned_amount_cents`
-- - computed at read time (`@/lib/travel/budget.ts`), never stored.
create table if not exists public.trip_budget_categories (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  name text not null,
  planned_amount_cents integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trip_budget_categories_name_length check (char_length(name) between 1 and 100),
  constraint trip_budget_categories_planned_non_negative check (planned_amount_cents >= 0)
);

create index if not exists trip_budget_categories_trip_id_idx on public.trip_budget_categories (trip_id, sort_order);

alter table public.trip_budget_categories enable row level security;

create policy "Users can manage their own trip budget categories" on public.trip_budget_categories
  for all to authenticated
  using (exists (select 1 from public.trips t where t.id = trip_budget_categories.trip_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_budget_categories.trip_id and t.owner_id = auth.uid()));

create function public.set_trip_budget_categories_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_trip_budget_categories_updated
  before update on public.trip_budget_categories
  for each row
  execute function public.set_trip_budget_categories_updated_at();
