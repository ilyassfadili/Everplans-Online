-- Travel Planner (Product #3) - activities (Prompt 2 Phase 2).
--
-- Completes "Trip -> Days -> Activities": `public.trip_activities` is a
-- child of `public.trip_days`, the same one-level-further child shape
-- `wedding_event_vendors`/`wedding_event_guests` already establish against
-- `wedding_events` -> `weddings` - RLS here traverses two levels back up
-- to `trips.owner_id` (`trip_activities` -> `trip_days` -> `trips`), the
-- same two-level join those junction tables already use.
--
-- `start_time`/`end_time` are both nullable - Phase 3 ("Timeline") explicitly
-- requires "handle activities without a specific time gracefully," so an
-- activity genuinely may carry no time at all, not just an optional end
-- time. `category` is free text constrained by a closed `check` list (the
-- same "curated in UI, not DB" convention `trips.trip_type` already
-- established), not a Postgres enum.
create table if not exists public.trip_activities (
  id uuid primary key default gen_random_uuid(),
  trip_day_id uuid not null references public.trip_days (id) on delete cascade,
  title text not null,
  start_time time,
  end_time time,
  location text,
  category text not null default 'other',
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trip_activities_title_length check (char_length(title) between 1 and 150),
  constraint trip_activities_location_length check (location is null or char_length(location) <= 200),
  constraint trip_activities_notes_length check (notes is null or char_length(notes) <= 1000),
  constraint trip_activities_category_valid check (
    category in ('sightseeing', 'food', 'transportation', 'accommodation', 'entertainment', 'shopping', 'nature', 'other')
  ),
  -- Only enforced when both times are actually set - an activity with just
  -- a start time (no end) or no time at all is always valid.
  constraint trip_activities_time_range_valid check (start_time is null or end_time is null or end_time >= start_time)
);

create index if not exists trip_activities_trip_day_id_idx on public.trip_activities (trip_day_id, start_time);

alter table public.trip_activities enable row level security;

create policy "Users can manage their own trip activities" on public.trip_activities
  for all to authenticated
  using (
    exists (
      select 1
      from public.trip_days d
      join public.trips t on t.id = d.trip_id
      where d.id = trip_activities.trip_day_id and t.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.trip_days d
      join public.trips t on t.id = d.trip_id
      where d.id = trip_activities.trip_day_id and t.owner_id = auth.uid()
    )
  );

create function public.set_trip_activities_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_trip_activities_updated
  before update on public.trip_activities
  for each row
  execute function public.set_trip_activities_updated_at();
