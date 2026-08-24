-- Travel Planner (Product #3) - essential travel information (Prompt 4
-- Phase 3).
--
-- `public.trip_emergency_contacts` is the one genuinely NEW data model
-- this phase introduces. Accommodation and transportation information
-- reuse Prompt 3's `trip_bookings` (filtered by `booking_type` at the
-- application layer, `@/lib/travel/bookings`'s own `getBookingsForTrip`) -
-- no second, duplicate booking table. "Important trip information"
-- reuses the trip's own `notes` column (`trips.notes`, from Prompt 1) -
-- no second notes field. This migration only adds what nothing existing
-- already covers: people to contact in an emergency.
create table if not exists public.trip_emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  name text not null,
  relationship text not null,
  phone text not null,
  email text,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trip_emergency_contacts_name_length check (char_length(name) between 1 and 150),
  constraint trip_emergency_contacts_relationship_length check (char_length(relationship) between 1 and 100),
  constraint trip_emergency_contacts_phone_length check (char_length(phone) between 1 and 50),
  constraint trip_emergency_contacts_email_length check (email is null or char_length(email) <= 254),
  constraint trip_emergency_contacts_notes_length check (notes is null or char_length(notes) <= 500)
);

create index if not exists trip_emergency_contacts_trip_id_idx on public.trip_emergency_contacts (trip_id, sort_order);

alter table public.trip_emergency_contacts enable row level security;

create policy "Users can manage their own trip emergency contacts" on public.trip_emergency_contacts
  for all to authenticated
  using (exists (select 1 from public.trips t where t.id = trip_emergency_contacts.trip_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_emergency_contacts.trip_id and t.owner_id = auth.uid()));

create function public.set_trip_emergency_contacts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_trip_emergency_contacts_updated
  before update on public.trip_emergency_contacts
  for each row
  execute function public.set_trip_emergency_contacts_updated_at();
