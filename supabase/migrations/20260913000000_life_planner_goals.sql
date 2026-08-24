-- Life Planner (Product #5) - Life Goals.
--
-- Everplans Life Planner Prompt 2 Phase 2 scope: `public.life_goals`, the
-- second child of `public.life_plans`
-- (`supabase/migrations/20260911000000_life_planner_foundation.sql`), and a
-- sibling to `public.life_areas`
-- (`supabase/migrations/20260912000000_life_planner_areas.sql`) rather than
-- its child - a goal optionally files under one Life Area (`life_area_id`),
-- but isn't owned by it, so removing an area never takes a goal down with
-- it (`on delete set null`, not `cascade`).
--
-- Unlike `life_areas`, `life_goals` carries its own `owner_id` directly
-- rather than needing a `plan_id` at all - a goal belongs to a person, not
-- to a specific Life Area or plan row, the same "user-owned, not
-- area-owned" reasoning `budget_goals` already applies one product over.
--
-- `progress` is a plain 0-100 integer, set directly by the user for now -
-- Prompt 2 Phase 2's own spec ("no gamification") keeps this simple rather
-- than deriving it from milestones/action steps yet. Once
-- `life_goal_milestones`/`life_goal_action_steps` exist (Phase 3), progress
-- becomes optionally derived from completed action steps and written back
-- here on every completion toggle - see the master spec's own note - but
-- this column is real and user-settable from day one either way.
--
-- Prepared but NOT YET APPLIED to the live Supabase project - the assistant
-- that built this doesn't hold elevated Supabase credentials in this
-- environment, the same "code is real, dashboard/database state is
-- pending" situation as `20260911000000_life_planner_foundation.sql` and
-- `20260912000000_life_planner_areas.sql`. Apply via `supabase db push` or
-- the SQL Editor at supabase.com/dashboard.
create table if not exists public.life_goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  life_area_id uuid references public.life_areas (id) on delete set null,
  title text not null,
  description text,
  target_date date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed', 'paused')),
  progress smallint not null default 0 check (progress >= 0 and progress <= 100),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists life_goals_owner_id_idx on public.life_goals (owner_id);
create index if not exists life_goals_life_area_id_idx on public.life_goals (life_area_id);

alter table public.life_goals enable row level security;

-- Narrow per-operation policies, each scoped directly to
-- `owner_id = auth.uid()` - the same shape `life_areas`' own policies use.
create policy "Users can read their own life goals" on public.life_goals
  for select to authenticated using (owner_id = auth.uid());

create policy "Users can create their own life goals" on public.life_goals
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can update their own life goals" on public.life_goals
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Users can delete their own life goals" on public.life_goals
  for delete to authenticated using (owner_id = auth.uid());

-- Each table's own trigger function, written fresh rather than shared or
-- retroactively edited from an earlier migration - the same deliberate
-- duplication `set_life_areas_updated_at` uses.
create function public.set_life_goals_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_life_goals_updated
  before update on public.life_goals
  for each row
  execute function public.set_life_goals_updated_at();
