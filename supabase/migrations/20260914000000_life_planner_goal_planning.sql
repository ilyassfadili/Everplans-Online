-- Life Planner (Product #5) - Goal Planning.
--
-- Everplans Life Planner Prompt 2 Phase 3 scope: `public.life_goal_milestones`
-- and `public.life_goal_action_steps`, both children of `public.life_goals`
-- (`supabase/migrations/20260913000000_life_planner_goals.sql`). An action
-- step optionally files under one of its own goal's milestones
-- (`milestone_id`), the same "optional filing reference, not an ownership
-- relationship" shape `life_goals.life_area_id` already uses one level up -
-- removing a milestone demotes its steps to "unassigned" (`on delete set
-- null`), it never deletes or orphans-invalidly them.
--
-- Both tables carry their own `owner_id` directly (like `life_goals`, unlike
-- `life_areas`) rather than needing a join through `goal_id` to reach one -
-- a milestone/action step belongs to a person first, the same "user-owned,
-- not parent-owned" reasoning `life_goals` itself already applies.
--
-- `life_goals.progress` becomes derived once either table has rows for a
-- goal - see `recomputeGoalProgress` (`@/lib/life-planner/life-goal-planning`)
-- for the exact rule. Neither table changes `life_goals.progress`'s own
-- column definition; that migration is untouched.
--
-- Prepared but NOT YET APPLIED to the live Supabase project - the assistant
-- that built this doesn't hold elevated Supabase credentials in this
-- environment, the same "code is real, dashboard/database state is
-- pending" situation as every earlier Life Planner migration. Apply via
-- `supabase db push` or the SQL Editor at supabase.com/dashboard.
create table if not exists public.life_goal_milestones (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null references public.life_goals (id) on delete cascade,
  title text not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  target_date date,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists life_goal_milestones_owner_id_idx on public.life_goal_milestones (owner_id);
create index if not exists life_goal_milestones_goal_id_idx on public.life_goal_milestones (goal_id);

alter table public.life_goal_milestones enable row level security;

create policy "Users can read their own life goal milestones" on public.life_goal_milestones
  for select to authenticated using (owner_id = auth.uid());

create policy "Users can create their own life goal milestones" on public.life_goal_milestones
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can update their own life goal milestones" on public.life_goal_milestones
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Users can delete their own life goal milestones" on public.life_goal_milestones
  for delete to authenticated using (owner_id = auth.uid());

create function public.set_life_goal_milestones_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_life_goal_milestones_updated
  before update on public.life_goal_milestones
  for each row
  execute function public.set_life_goal_milestones_updated_at();

create table if not exists public.life_goal_action_steps (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null references public.life_goals (id) on delete cascade,
  milestone_id uuid references public.life_goal_milestones (id) on delete set null,
  title text not null,
  is_completed boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists life_goal_action_steps_owner_id_idx on public.life_goal_action_steps (owner_id);
create index if not exists life_goal_action_steps_goal_id_idx on public.life_goal_action_steps (goal_id);
create index if not exists life_goal_action_steps_milestone_id_idx on public.life_goal_action_steps (milestone_id);

alter table public.life_goal_action_steps enable row level security;

create policy "Users can read their own life goal action steps" on public.life_goal_action_steps
  for select to authenticated using (owner_id = auth.uid());

create policy "Users can create their own life goal action steps" on public.life_goal_action_steps
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can update their own life goal action steps" on public.life_goal_action_steps
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Users can delete their own life goal action steps" on public.life_goal_action_steps
  for delete to authenticated using (owner_id = auth.uid());

create function public.set_life_goal_action_steps_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_life_goal_action_steps_updated
  before update on public.life_goal_action_steps
  for each row
  execute function public.set_life_goal_action_steps_updated_at();
