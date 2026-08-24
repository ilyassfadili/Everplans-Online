-- Wedding Planner: venues and events (Prompt 5 Phases 1-2). One unified
-- `wedding_events` table represents every kind of wedding event (ceremony,
-- reception, rehearsal, welcome party, ...) as data - `event_type` is a
-- plain text column with a curated option list in the UI
-- (`@/components/wedding/event-type-options.ts`), not a separate table or
-- enum per event kind (Phase 1: "do not hardcode these as separate
-- technical systems").
--
-- Venues are their own table, referenced optionally by an event
-- (`venue_id`) - never duplicated onto the event row itself, and an event
-- is never required to have one ("a welcome drinks event at someone's
-- house" is a legitimate event with no formal venue record).
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status every migration in this repo starts in. Apply with
-- `supabase db push` or the SQL Editor at https://supabase.com/dashboard.

create table if not exists public.wedding_venues (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  address text,
  contact_phone text,
  contact_email text,
  website text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint wedding_venues_name_length check (char_length(name) between 1 and 150)
);

create index if not exists wedding_venues_wedding_id_idx on public.wedding_venues (wedding_id);

alter table public.wedding_venues enable row level security;

create policy "Users can manage their own wedding venues"
  on public.wedding_venues
  for all
  to authenticated
  using (exists (select 1 from public.weddings w where w.id = wedding_venues.wedding_id and w.owner_id = auth.uid()))
  with check (exists (select 1 from public.weddings w where w.id = wedding_venues.wedding_id and w.owner_id = auth.uid()));

create function public.set_wedding_venues_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_wedding_venues_updated
  before update on public.wedding_venues
  for each row execute function public.set_wedding_venues_updated_at();

create table if not exists public.wedding_events (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  venue_id uuid references public.wedding_venues (id) on delete set null,
  name text not null,
  description text,
  event_type text,
  event_date date not null,
  start_time time,
  end_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint wedding_events_name_length check (char_length(name) between 1 and 150)
);

create index if not exists wedding_events_wedding_id_idx on public.wedding_events (wedding_id, event_date);

alter table public.wedding_events enable row level security;

create policy "Users can manage their own wedding events"
  on public.wedding_events
  for all
  to authenticated
  using (exists (select 1 from public.weddings w where w.id = wedding_events.wedding_id and w.owner_id = auth.uid()))
  with check (exists (select 1 from public.weddings w where w.id = wedding_events.wedding_id and w.owner_id = auth.uid()));

create function public.set_wedding_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_wedding_events_updated
  before update on public.wedding_events
  for each row execute function public.set_wedding_events_updated_at();

-- Event <-> vendor and event <-> guest are both genuine many-to-many
-- relationships (a photographer can cover both the ceremony and the
-- reception; a guest can be invited to the welcome party and the
-- reception but not the rehearsal dinner) - plain join tables referencing
-- the canonical `wedding_vendors`/`wedding_guests` records, never a copy
-- of vendor/guest data.
create table if not exists public.wedding_event_vendors (
  event_id uuid not null references public.wedding_events (id) on delete cascade,
  vendor_id uuid not null references public.wedding_vendors (id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (event_id, vendor_id)
);

alter table public.wedding_event_vendors enable row level security;

create policy "Users can manage their own event-vendor links"
  on public.wedding_event_vendors
  for all
  to authenticated
  using (exists (select 1 from public.wedding_events e where e.id = wedding_event_vendors.event_id and exists (
    select 1 from public.weddings w where w.id = e.wedding_id and w.owner_id = auth.uid()
  )))
  with check (exists (select 1 from public.wedding_events e where e.id = wedding_event_vendors.event_id and exists (
    select 1 from public.weddings w where w.id = e.wedding_id and w.owner_id = auth.uid()
  )));

create table if not exists public.wedding_event_guests (
  event_id uuid not null references public.wedding_events (id) on delete cascade,
  guest_id uuid not null references public.wedding_guests (id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (event_id, guest_id)
);

alter table public.wedding_event_guests enable row level security;

create policy "Users can manage their own event-guest links"
  on public.wedding_event_guests
  for all
  to authenticated
  using (exists (select 1 from public.wedding_events e where e.id = wedding_event_guests.event_id and exists (
    select 1 from public.weddings w where w.id = e.wedding_id and w.owner_id = auth.uid()
  )))
  with check (exists (select 1 from public.wedding_events e where e.id = wedding_event_guests.event_id and exists (
    select 1 from public.weddings w where w.id = e.wedding_id and w.owner_id = auth.uid()
  )));

-- Extends the existing task architecture (Phase 2: "must extend the
-- existing task architecture rather than create a separate task system")
-- - `on delete set null` so deleting an event never deletes the tasks
-- that referenced it, matching every other optional relationship in this
-- schema (`milestone_id`, `category_id`, `vendor_id`).
alter table public.wedding_tasks
  add column if not exists event_id uuid references public.wedding_events (id) on delete set null;

create index if not exists wedding_tasks_event_id_idx on public.wedding_tasks (event_id);
