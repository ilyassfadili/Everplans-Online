-- Home Planner (Product #4) - workspace foundation (Prompt 1 Phase 1).
--
-- Same shape as `20260907000000_travel_planner_foundation.sql`: a
-- hand-built product gets its own purpose-built table, not an instance of
-- the generic `planner_definitions`/`planner_instances` marketplace.
-- `public.homes` is Home Planner's root workspace - one row per account,
-- the same "workspace exists yet?" gate `getWeddingForCurrentUser()`/
-- `getTripForCurrentUser()` already use to decide onboarding vs. workspace.
--
-- Everplans Home Planner Prompt 1 scope only: the basic home profile
-- fields Phase 2's setup flow will collect (name, type, ownership status,
-- address, optional notes). No entitlement/commerce coupling here - Home
-- Planner is not gated by `public.entitlements` yet (that's Prompt 6);
-- through Prompt 5 it behaves like Wedding/Travel Planner do today, reached
-- directly rather than via a purchase.
create table if not exists public.homes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  -- Free text constrained by a closed `check` list, not a Postgres enum -
  -- the same "curated in UI, not DB" convention `trips.trip_type` already
  -- established.
  home_type text not null default 'house',
  ownership_status text not null default 'own',
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  -- Optional additional details about the home - Phase 2's "Optional
  -- additional details appropriate to the home profile".
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint homes_owner_unique unique (owner_id),
  constraint homes_name_length check (char_length(name) between 1 and 150),
  constraint homes_home_type_valid check (
    home_type in ('house', 'apartment', 'condo', 'townhouse', 'mobile-home', 'other')
  ),
  constraint homes_ownership_status_valid check (
    ownership_status in ('own', 'rent', 'other')
  ),
  constraint homes_address_line1_length check (address_line1 is null or char_length(address_line1) <= 200),
  constraint homes_address_line2_length check (address_line2 is null or char_length(address_line2) <= 200),
  constraint homes_city_length check (city is null or char_length(city) <= 100),
  constraint homes_state_length check (state is null or char_length(state) <= 100),
  constraint homes_postal_code_length check (postal_code is null or char_length(postal_code) <= 20),
  constraint homes_country_length check (country is null or char_length(country) <= 100),
  constraint homes_notes_length check (notes is null or char_length(notes) <= 2000)
);

create index if not exists homes_owner_id_idx on public.homes (owner_id);

alter table public.homes enable row level security;

-- Narrow per-operation policies on the root workspace table (no delete
-- policy - removing a workspace isn't in scope, same as `trips`/`weddings`),
-- each scoped directly to `owner_id = auth.uid()`.
create policy "Users can read their own home" on public.homes
  for select to authenticated using (owner_id = auth.uid());

create policy "Users can create their own home" on public.homes
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can update their own home" on public.homes
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create function public.set_homes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_homes_updated
  before update on public.homes
  for each row
  execute function public.set_homes_updated_at();

-- Household members foundation (Prompt 1 Phase 1 task 5) - a child table of
-- `public.homes` (the same "child references root, RLS traverses back up"
-- shape `trip_days` establishes against `trips`), not a second owner-scoped
-- root table. The Home Profile setup flow (Prompt 1 Phase 2) is what
-- actually lets a user create/edit/remove these; this migration only
-- establishes the data model.
create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  name text not null,
  relationship text not null default 'other',
  -- Optional relevant information - Phase 2's "Optional relevant
  -- information" per household member.
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint household_members_name_length check (char_length(name) between 1 and 150),
  constraint household_members_relationship_valid check (
    relationship in ('self', 'spouse-partner', 'child', 'parent', 'roommate', 'pet', 'other')
  ),
  constraint household_members_notes_length check (notes is null or char_length(notes) <= 1000)
);

create index if not exists household_members_home_id_idx on public.household_members (home_id);

alter table public.household_members enable row level security;

-- A single `for all` policy on this child table (not narrow per-operation
-- policies like `homes` itself carries) - the same convention `trip_days`
-- establishes for a pure child table: a correlated subquery back to the
-- root's `owner_id`, covering select/insert/update/delete in one policy
-- since there's no reason to split them for a row that only ever belongs
-- to one home.
create policy "Users can manage their own household members" on public.household_members
  for all to authenticated
  using (exists (select 1 from public.homes h where h.id = household_members.home_id and h.owner_id = auth.uid()))
  with check (exists (select 1 from public.homes h where h.id = household_members.home_id and h.owner_id = auth.uid()));

create function public.set_household_members_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_household_members_updated
  before update on public.household_members
  for each row
  execute function public.set_household_members_updated_at();
