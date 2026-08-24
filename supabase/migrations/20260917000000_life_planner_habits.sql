-- Life Planner (Product #5) - Habits & Routines: the Habits half (Routines
-- is its own table set, `supabase/migrations/20260916000000_life_planner_routines.sql`
-- - see that migration's own header comment). Everplans Life Planner
-- Prompt 3 Phase 3 scope: two tables.
--
-- `public.life_habits` - a fifth top-level table alongside `life_areas`,
-- `life_goals`, `life_tasks`, and `life_routines` (not a child of any of
-- them) - a recurring behavior the user wants to track (e.g. "Drink water",
-- "Read 20 minutes"), structurally flatter than a Routine: no sub-items,
-- just a name and a `frequency`. `life_area_id`/`goal_id` are both optional,
-- nullable filing references, not ownership relationships (`on delete set
-- null` on both), the same "sibling, not child" shape `life_tasks` already
-- establishes for the same two columns.
--
-- `frequency` is one of `'daily'`, `'weekly'`, or `'x_per_week'`.
-- `target_per_period` only means something beyond "1" for `'weekly'`/
-- `'x_per_week'` - see `computeHabitProgress` (`@/lib/life-planner/life-habits`)
-- for the full quirk this deliberately documents: `life_habit_logs` is
-- date-grained (at most one row per habit per calendar day, enforced by
-- this table's own `unique (habit_id, logged_on)`), so a `'daily'` habit can
-- never log more than once in its own one-day period regardless of what
-- `target_per_period` holds - the creation/edit forms hide that field for
-- `'daily'` and default it to `1` rather than let a user set an unusable
-- value.
--
-- `public.life_habit_logs` - a per-habit, per-day completion log, not a
-- boolean flag on the habit itself - the exact same "done" has to be scoped
-- to *which day* reasoning `life_routine_completions` already documents.
-- `unique (habit_id, logged_on)` backs `toggleHabitLogForDate`'s own
-- insert-or-delete toggle - no `update` policy and no `updated_at` column,
-- since a log is either recorded for a day or it isn't; there's nothing on
-- the row itself to edit in place, only to create or remove (an
-- append/delete log, not a mutable record).
--
-- Prepared but NOT YET APPLIED to the live Supabase project - the assistant
-- that built this doesn't hold elevated Supabase credentials in this
-- environment, the same "code is real, dashboard/database state is
-- pending" situation as every earlier Life Planner migration. Apply via
-- `supabase db push` or the SQL Editor at supabase.com/dashboard.

create table if not exists public.life_habits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  life_area_id uuid references public.life_areas (id) on delete set null,
  goal_id uuid references public.life_goals (id) on delete set null,
  name text not null,
  description text,
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly', 'x_per_week')),
  target_per_period smallint not null default 1 check (target_per_period > 0),
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists life_habits_owner_id_idx on public.life_habits (owner_id);
create index if not exists life_habits_life_area_id_idx on public.life_habits (life_area_id);
create index if not exists life_habits_goal_id_idx on public.life_habits (goal_id);

alter table public.life_habits enable row level security;

-- Narrow per-operation policies, each scoped directly to
-- `owner_id = auth.uid()` - the same shape `life_tasks`'/`life_routines`'
-- own policies use.
create policy "Users can read their own life habits" on public.life_habits
  for select to authenticated using (owner_id = auth.uid());

create policy "Users can create their own life habits" on public.life_habits
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can update their own life habits" on public.life_habits
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Users can delete their own life habits" on public.life_habits
  for delete to authenticated using (owner_id = auth.uid());

-- Each table's own trigger function, written fresh rather than shared or
-- retroactively edited from an earlier migration - the same deliberate
-- duplication `set_life_routines_updated_at` uses.
create function public.set_life_habits_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_life_habits_updated
  before update on public.life_habits
  for each row
  execute function public.set_life_habits_updated_at();

create table if not exists public.life_habit_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.life_habits (id) on delete cascade,
  logged_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (habit_id, logged_on)
);

create index if not exists life_habit_logs_owner_id_idx on public.life_habit_logs (owner_id);
create index if not exists life_habit_logs_habit_date_idx on public.life_habit_logs (habit_id, logged_on);

alter table public.life_habit_logs enable row level security;

-- select/insert/delete only - no update policy and no `updated_at` trigger,
-- this table is an append/delete log, not a mutable record (see this
-- migration's own header comment).
create policy "Users can read their own life habit logs" on public.life_habit_logs
  for select to authenticated using (owner_id = auth.uid());

create policy "Users can create their own life habit logs" on public.life_habit_logs
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can delete their own life habit logs" on public.life_habit_logs
  for delete to authenticated using (owner_id = auth.uid());
