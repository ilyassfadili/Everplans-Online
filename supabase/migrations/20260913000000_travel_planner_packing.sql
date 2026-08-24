-- Travel Planner (Product #3) - packing checklist (Prompt 4 Phase 1).
--
-- `public.trip_packing_items` is a direct child of `trips` (like
-- `trip_budget_categories`/`trip_bookings`, not nested under `trip_days` -
-- packing is trip-wide, not tied to a specific day). `category` is free
-- text constrained by a closed `check` list, the same "curated in UI, not
-- DB" convention `trips.trip_type`/`trip_activities.category` already
-- establish - deliberately a short, practical list (Phase 1's own "do not
-- create excessive categories").
create table if not exists public.trip_packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  name text not null,
  category text not null default 'other',
  quantity integer not null default 1,
  is_complete boolean not null default false,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trip_packing_items_name_length check (char_length(name) between 1 and 150),
  constraint trip_packing_items_notes_length check (notes is null or char_length(notes) <= 500),
  constraint trip_packing_items_quantity_valid check (quantity between 1 and 999),
  constraint trip_packing_items_category_valid check (
    category in ('clothing', 'toiletries', 'electronics', 'travel-documents', 'personal-essentials', 'health', 'other')
  )
);

create index if not exists trip_packing_items_trip_id_idx on public.trip_packing_items (trip_id, sort_order);

alter table public.trip_packing_items enable row level security;

create policy "Users can manage their own trip packing items" on public.trip_packing_items
  for all to authenticated
  using (exists (select 1 from public.trips t where t.id = trip_packing_items.trip_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_packing_items.trip_id and t.owner_id = auth.uid()));

create function public.set_trip_packing_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_trip_packing_items_updated
  before update on public.trip_packing_items
  for each row
  execute function public.set_trip_packing_items_updated_at();
