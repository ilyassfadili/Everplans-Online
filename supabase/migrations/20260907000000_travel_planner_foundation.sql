-- Travel Planner (Product #3) - trip workspace foundation.
--
-- Same shape as `20260823000000_wedding_workspace.sql`: a hand-built
-- product gets its own purpose-built table, not an instance of the generic
-- `planner_definitions`/`planner_instances` marketplace (`@/types/wedding`'s
-- own comment explains why that split exists). `public.trips` is Travel
-- Planner's root workspace - one row per account, the same "workspace
-- exists yet?" gate `getWeddingForCurrentUser()`/`getBudgetPlanForCurrentUser()`
-- already use to decide onboarding vs. workspace.
--
-- Everplans Travel Planner Prompt 1 Phase 2 scope only: destination, travel
-- dates, traveler count, trip type, trip goals, and notes. Deliberately no
-- `currency` column yet (unlike `weddings`/`budget_plans`) - no money-bearing
-- feature exists on this table yet, and Prompt 3 (Budget) is what will
-- introduce one, exactly when it's actually needed. No stored
-- status/progress column either - "basic planning status/progress" (Phase 2
-- task 3) is computed at read time from this row's own fields
-- (`@/lib/travel/progress.ts`), the same "derived, never stored" rule
-- `WeddingProgress` already follows, so it can never drift from the data it
-- summarizes.
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  destination text not null,
  start_date date not null,
  end_date date not null,
  traveler_count integer not null default 1,
  -- Free text constrained by a closed `check` list, not a Postgres enum -
  -- the same "curated in UI, not DB" convention `wedding_events.event_type`
  -- already established (adding a trip type later is a migration either
  -- way; a `check` list keeps that migration a one-line constraint change
  -- instead of an `alter type`).
  trip_type text not null default 'vacation',
  trip_goals text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trips_owner_unique unique (owner_id),
  constraint trips_destination_length check (char_length(destination) between 1 and 200),
  constraint trips_dates_valid check (end_date >= start_date),
  constraint trips_traveler_count_valid check (traveler_count between 1 and 50),
  constraint trips_trip_type_valid check (
    trip_type in ('vacation', 'family', 'couple', 'solo', 'business', 'road-trip', 'other')
  ),
  constraint trips_trip_goals_length check (trip_goals is null or char_length(trip_goals) <= 500),
  constraint trips_notes_length check (notes is null or char_length(notes) <= 2000)
);

create index if not exists trips_owner_id_idx on public.trips (owner_id);

alter table public.trips enable row level security;

-- Narrow per-operation policies on the root workspace table (no delete
-- policy - removing a workspace isn't in scope, same as `weddings`), each
-- scoped directly to `owner_id = auth.uid()`.
create policy "Users can read their own trip" on public.trips
  for select to authenticated using (owner_id = auth.uid());

create policy "Users can create their own trip" on public.trips
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can update their own trip" on public.trips
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Each table's own trigger function, written fresh rather than shared or
-- retroactively edited from an earlier migration - the same deliberate
-- duplication `set_weddings_updated_at`/`set_budget_plans_updated_at` use.
create function public.set_trips_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_trips_updated
  before update on public.trips
  for each row
  execute function public.set_trips_updated_at();
