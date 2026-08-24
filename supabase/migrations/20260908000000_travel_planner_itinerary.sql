-- Travel Planner (Product #3) - itinerary foundation (Prompt 2 Phase 1).
--
-- Establishes "Trip -> Days -> Activities" (Activities land in Phase 2).
-- `public.trip_days` is deliberately a *child* table of `public.trips`
-- (the same "child references root, RLS traverses back up" shape
-- `wedding_important_dates` already establishes against `weddings`), not a
-- duplication of the trip's own date range: the full list of calendar days
-- a trip spans is always derived at read time from `trips.start_date`/
-- `end_date` (`@/lib/travel/itinerary`'s `buildItineraryDays`), never
-- stored here. A `trip_days` row exists only once a traveler adds a day
-- title/notes for that date, or (from Phase 2 onward) an activity - the
-- same "optional enrichment, not required scaffolding" shape
-- `trips.trip_goals`/`notes` already established for the trip itself.
--
-- `trip_days_trip_date_unique` is what makes "one row per calendar date"
-- an actual guarantee, not just an application convention - it's also
-- exactly the constraint `upsertTripDay`'s `onConflict` targets, so a
-- double-save of the same day updates in place instead of creating a
-- second row for the same date.
create table if not exists public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  day_date date not null,
  title text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trip_days_trip_date_unique unique (trip_id, day_date),
  constraint trip_days_title_length check (title is null or char_length(title) <= 150),
  constraint trip_days_notes_length check (notes is null or char_length(notes) <= 1000)
);

create index if not exists trip_days_trip_id_idx on public.trip_days (trip_id, day_date);

alter table public.trip_days enable row level security;

-- A single `for all` policy on this child table (not narrow per-operation
-- policies like `trips` itself carries) - the same convention
-- `budget_income_sources` establishes for a pure child table: a
-- correlated subquery back to the root's `owner_id`, covering
-- select/insert/update/delete in one policy since there's no reason to
-- split them for a row that only ever belongs to one trip.
create policy "Users can manage their own trip days" on public.trip_days
  for all to authenticated
  using (exists (select 1 from public.trips t where t.id = trip_days.trip_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_days.trip_id and t.owner_id = auth.uid()));

create function public.set_trip_days_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_trip_days_updated
  before update on public.trip_days
  for each row
  execute function public.set_trip_days_updated_at();
