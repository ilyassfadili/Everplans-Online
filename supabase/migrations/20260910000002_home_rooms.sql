-- Home Planner (Product #4) - Rooms system (Everplans Home Planner
-- Prompt 2 Phase 1: "Create a polished system for organizing the user's
-- home by rooms").
--
-- `public.home_rooms` is a child table of `public.homes` - the same
-- "child references root, RLS traverses back up" shape `household_members`
-- and `home_contacts` already establish. This is the foundation Prompt 2
-- Phase 2 (Inventory) will attach items to via a `room_id` foreign key -
-- deliberately just name/type/description/notes for this phase, nothing
-- from inventory/maintenance/projects, which don't exist yet.
create table if not exists public.home_rooms (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  name text not null,
  -- Free text constrained by a closed `check` list, not a Postgres enum -
  -- the same "curated in UI, not DB" convention `homes.home_type` already
  -- established. "other" is always a safe fallback so the list is never
  -- unnecessarily restrictive (Phase 1's own instruction).
  room_type text not null default 'other',
  description text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint home_rooms_name_length check (char_length(name) between 1 and 150),
  constraint home_rooms_room_type_valid check (
    room_type in (
      'living-room', 'bedroom', 'kitchen', 'bathroom', 'office', 'dining-room',
      'garage', 'basement', 'garden', 'other'
    )
  ),
  constraint home_rooms_description_length check (description is null or char_length(description) <= 500),
  constraint home_rooms_notes_length check (notes is null or char_length(notes) <= 2000)
);

create index if not exists home_rooms_home_id_idx on public.home_rooms (home_id);

alter table public.home_rooms enable row level security;

-- A single `for all` policy on this child table, the same convention
-- `household_members`/`home_contacts` establish: a correlated subquery
-- back to the root's `owner_id`, covering select/insert/update/delete in
-- one policy.
create policy "Users can manage their own rooms" on public.home_rooms
  for all to authenticated
  using (exists (select 1 from public.homes h where h.id = home_rooms.home_id and h.owner_id = auth.uid()))
  with check (exists (select 1 from public.homes h where h.id = home_rooms.home_id and h.owner_id = auth.uid()));

create function public.set_home_rooms_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_home_rooms_updated
  before update on public.home_rooms
  for each row
  execute function public.set_home_rooms_updated_at();
