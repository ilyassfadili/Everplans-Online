-- Life Planner (Product #5) - Personal Tasks.
--
-- Everplans Life Planner Prompt 3 Phase 1 scope: `public.life_tasks`, a
-- third top-level table alongside `public.life_goals`
-- (`supabase/migrations/20260913000000_life_planner_goals.sql`) and
-- `public.life_areas` (`supabase/migrations/20260912000000_life_planner_areas.sql`)
-- rather than a child of either - a task optionally files under one Life
-- Area (`life_area_id`) and/or one Life Goal (`goal_id`), but isn't owned by
-- either, so removing an area or a goal never takes a task down with it
-- (`on delete set null` on both, the same "optional filing reference, not
-- an ownership relationship" shape `life_goals.life_area_id` already uses
-- one level up).
--
-- Like `life_goals`, `life_tasks` carries its own `owner_id` directly rather
-- than needing a join through `life_area_id`/`goal_id` to reach one - a task
-- belongs to a person first, the same "user-owned, not parent-owned"
-- reasoning `life_goals` itself already applies.
--
-- `is_archived` is this table's only "delete" affordance from the UI - see
-- `archiveTask` (`@/lib/life-planner/life-tasks`) - `deleteTask` (a real hard
-- delete) exists in the DAL for parity with every other Life Planner table,
-- but the tasks UI never surfaces it as the primary action.
--
-- Prepared but NOT YET APPLIED to the live Supabase project - the assistant
-- that built this doesn't hold elevated Supabase credentials in this
-- environment, the same "code is real, dashboard/database state is
-- pending" situation as every earlier Life Planner migration. Apply via
-- `supabase db push` or the SQL Editor at supabase.com/dashboard.
create table if not exists public.life_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  life_area_id uuid references public.life_areas (id) on delete set null,
  goal_id uuid references public.life_goals (id) on delete set null,
  title text not null,
  description text,
  due_date date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'completed')),
  completed_at timestamptz,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists life_tasks_owner_id_idx on public.life_tasks (owner_id);
create index if not exists life_tasks_life_area_id_idx on public.life_tasks (life_area_id);
create index if not exists life_tasks_goal_id_idx on public.life_tasks (goal_id);

alter table public.life_tasks enable row level security;

-- Narrow per-operation policies, each scoped directly to
-- `owner_id = auth.uid()` - the same shape `life_goals`'/`life_areas`' own
-- policies use.
create policy "Users can read their own life tasks" on public.life_tasks
  for select to authenticated using (owner_id = auth.uid());

create policy "Users can create their own life tasks" on public.life_tasks
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can update their own life tasks" on public.life_tasks
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Users can delete their own life tasks" on public.life_tasks
  for delete to authenticated using (owner_id = auth.uid());

-- Each table's own trigger function, written fresh rather than shared or
-- retroactively edited from an earlier migration - the same deliberate
-- duplication `set_life_goals_updated_at` uses.
create function public.set_life_tasks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_life_tasks_updated
  before update on public.life_tasks
  for each row
  execute function public.set_life_tasks_updated_at();
