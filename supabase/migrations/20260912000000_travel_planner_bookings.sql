-- Travel Planner (Product #3) - bookings (Prompt 3 Phase 3).
--
-- `public.trip_bookings` is a centralized ORGANIZATION record for
-- reservations the traveler already made elsewhere - not a marketplace
-- and not connected to any external booking provider (this migration's own
-- scope boundary). A direct child of `trips` (like `trip_budget_categories`,
-- not nested under `trip_days`) - a booking is trip-wide, not tied to a
-- specific itinerary day the way an activity is.
--
-- `booking_type`/`status` are both free text constrained by closed `check`
-- lists, the same "curated in UI, not DB" convention `trips.trip_type` and
-- `trip_activities.category` already establish. `cost_cents` is nullable -
-- unlike an expense (which only ever exists because a real amount was
-- spent), a booking may be logged before its final price is known.
create table if not exists public.trip_bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  booking_type text not null default 'other',
  title text not null,
  provider text,
  confirmation_number text,
  booking_date date not null,
  booking_time time,
  location text,
  cost_cents integer,
  status text not null default 'planned',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trip_bookings_title_length check (char_length(title) between 1 and 150),
  constraint trip_bookings_provider_length check (provider is null or char_length(provider) <= 150),
  constraint trip_bookings_confirmation_length check (confirmation_number is null or char_length(confirmation_number) <= 100),
  constraint trip_bookings_location_length check (location is null or char_length(location) <= 200),
  constraint trip_bookings_notes_length check (notes is null or char_length(notes) <= 1000),
  constraint trip_bookings_cost_non_negative check (cost_cents is null or cost_cents >= 0),
  constraint trip_bookings_type_valid check (
    booking_type in ('flight', 'train', 'bus', 'hotel', 'car-rental', 'activity', 'restaurant', 'other')
  ),
  constraint trip_bookings_status_valid check (status in ('planned', 'confirmed', 'cancelled'))
);

create index if not exists trip_bookings_trip_id_idx on public.trip_bookings (trip_id, booking_date);

alter table public.trip_bookings enable row level security;

create policy "Users can manage their own trip bookings" on public.trip_bookings
  for all to authenticated
  using (exists (select 1 from public.trips t where t.id = trip_bookings.trip_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_bookings.trip_id and t.owner_id = auth.uid()));

create function public.set_trip_bookings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_trip_bookings_updated
  before update on public.trip_bookings
  for each row
  execute function public.set_trip_bookings_updated_at();
