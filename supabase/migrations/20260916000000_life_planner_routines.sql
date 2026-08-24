-- Life Planner (Product #5) - Habits & Routines: the Routines half (Habits
-- is its own table set, added in a later phase - see the master build
-- spec's Prompt 3 section).
--
-- Everplans Life Planner Prompt 3 Phase 2 scope: three tables.
--
-- `public.life_routines` - a fourth top-level table alongside `life_areas`,
-- `life_goals`, and `life_tasks` (not a child of either) - a recurring
-- checklist (e.g. "Morning routine") the user defines once and works
-- through on the days it's scheduled. `active_days` is a `smallint[]`
-- (0=Sunday..6=Saturday, matching JS `Date.prototype.getDay()`) that's only
-- meaningful when `frequency` is `'weekly'` or `'custom'` - kept as an empty
-- array (never null) for `'daily'`/`'weekdays'`, whose due-today logic never
-- reads it (see `isRoutineDueToday`, `@/lib/life-planner/life-routines`, for
-- exactly how each frequency value resolves "is this routine due today").
--
-- `public.life_routine_items` - a child of `life_routines`, the individual
-- checklist entries within one routine (e.g. "Make the bed", "Stretch"),
-- ordered by `position` within their own routine.
--
-- `public.life_routine_completions` - a per-item, per-day completion log,
-- not a boolean flag on the item itself - a routine repeats, so "done" has
-- to be scoped to *which day*, the same reasoning a future Habits table
-- will apply to its own logs. `unique (routine_item_id, completed_on)`
-- backs `toggleRoutineItemCompletion`'s insert-or-delete toggle - no
-- `update` policy and no `updated_at` column, since a completion is either
-- logged for a day or it isn't; there's nothing on the row itself to edit
-- in place, only to create or remove (an append/delete log, not a mutable
-- record).
--
-- Prepared but NOT YET APPLIED to the live Supabase project - the assistant
-- that built this doesn't hold elevated Supabase credentials in this
-- environment, the same "code is real, dashboard/database state is
-- pending" situation as every earlier Life Planner migration. Apply via
-- `supabase db push` or the SQL Editor at supabase.com/dashboard.

create table if not exists public.life_routines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  purpose text,
  routine_type text not null default 'custom' check (routine_type in ('morning', 'evening', 'weekly', 'custom')),
  frequency text not null default 'daily' check (frequency in ('daily', 'weekdays', 'weekly', 'custom')),
  -- 0=Sunday..6=Saturday. Only meaningful when `frequency` is 'weekly' or
  -- 'custom' - see this table's own header comment above.
  active_days smallint[] not null default '{}',
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists life_routines_owner_id_idx on public.life_routines (owner_id);

alter table public.life_routines enable row level security;

-- Narrow per-operation policies, each scoped directly to
-- `owner_id = auth.uid()` - the same shape `life_tasks`'/`life_goals`' own
-- policies use.
create policy "Users can read their own life routines" on public.life_routines
  for select to authenticated using (owner_id = auth.uid());

create policy "Users can create their own life routines" on public.life_routines
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can update their own life routines" on public.life_routines
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Users can delete their own life routines" on public.life_routines
  for delete to authenticated using (owner_id = auth.uid());

-- Each table's own trigger function, written fresh rather than shared or
-- retroactively edited from an earlier migration - the same deliberate
-- duplication `set_life_tasks_updated_at` uses.
create function public.set_life_routines_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_life_routines_updated
  before update on public.life_routines
  for each row
  execute function public.set_life_routines_updated_at();

create table if not exists public.life_routine_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  routine_id uuid not null references public.life_routines (id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists life_routine_items_owner_id_idx on public.life_routine_items (owner_id);
create index if not exists life_routine_items_routine_id_idx on public.life_routine_items (routine_id);

alter table public.life_routine_items enable row level security;

create policy "Users can read their own life routine items" on public.life_routine_items
  for select to authenticated using (owner_id = auth.uid());

create policy "Users can create their own life routine items" on public.life_routine_items
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can update their own life routine items" on public.life_routine_items
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Users can delete their own life routine items" on public.life_routine_items
  for delete to authenticated using (owner_id = auth.uid());

create function public.set_life_routine_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_life_routine_items_updated
  before update on public.life_routine_items
  for each row
  execute function public.set_life_routine_items_updated_at();

create table if not exists public.life_routine_completions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  routine_item_id uuid not null references public.life_routine_items (id) on delete cascade,
  completed_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (routine_item_id, completed_on)
);

create index if not exists life_routine_completions_owner_id_idx on public.life_routine_completions (owner_id);
create index if not exists life_routine_completions_item_date_idx on public.life_routine_completions (routine_item_id, completed_on);

alter table public.life_routine_completions enable row level security;

-- select/insert/delete only - no update policy and no `updated_at` trigger,
-- this table is an append/delete log, not a mutable record (see this
-- migration's own header comment).
create policy "Users can read their own life routine completions" on public.life_routine_completions
  for select to authenticated using (owner_id = auth.uid());

create policy "Users can create their own life routine completions" on public.life_routine_completions
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can delete their own life routine completions" on public.life_routine_completions
  for delete to authenticated using (owner_id = auth.uid());
