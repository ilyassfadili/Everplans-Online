-- Life Planner (Product #5) - Weekly & Monthly Planning (Life Planner
-- Prompt 4 Phase 1). Four tables, deliberately a thin curation/aggregation
-- layer over the goals/tasks/habits/routines that already exist - see
-- `@/lib/life-planner/life-planning`'s own header comment for the full
-- "surfaces existing data, doesn't duplicate it" framing.
--
-- `public.life_weekly_plans` - one row per user per calendar week
-- (`week_start` is always that week's Monday, matching every other Life
-- Planner date convention - see `getWeekStartForDate`,
-- `@/lib/life-planner/life-planning`). Created on-demand the first time a
-- user visits that week's planning view (`getOrCreateWeeklyPlan`), not via
-- a separate onboarding step - the same "auto-provision on first visit"
-- shape `life_plans` itself already establishes at the workspace level.
-- `unique (owner_id, week_start)` is what makes that on-demand creation
-- safe under a genuine race (two tabs hitting the same week at once) - the
-- same "let the database catch the race, treat 23505 as already exists"
-- pattern `life_plans_owner_unique` already backs for `createLifePlan`.
--
-- `public.life_weekly_priorities` - a short, user-ordered list of "what
-- matters this week," a child of `life_weekly_plans`. `source_type`/
-- `source_id` optionally point back at an existing `life_goals`/`life_tasks`
-- row the user chose to promote into this week's priorities rather than
-- typing a new title from scratch - `source_id` is deliberately NOT a
-- foreign key (a goal/task can belong to either table, so one column can't
-- carry two different FK targets at once), so ownership of whatever it
-- points at is verified in application code before a priority is ever
-- allowed to link to it (`addWeeklyPriority`,
-- `@/lib/life-planner/life-planning`) - the same "caller-supplied id,
-- unverified by the table's own insert policy" guard every other
-- cross-table filing reference in this product already applies. `'custom'`
-- (a priority typed from scratch, no source) is the default so a bare
-- `insert` without an explicit `source_type` still satisfies the check
-- constraint.
--
-- `public.life_monthly_plans` / `public.life_monthly_priorities` - the
-- exact same two-table shape one level up, `month_start` always the 1st of
-- the calendar month (`getMonthStartForDate`).
--
-- Unlike the append-only log tables earlier Life Planner phases added
-- (`life_habit_logs`, `life_routine_completions` - insert/delete only, no
-- `updated_at`), all four tables here are user-edited records (notes get
-- rewritten, a priority's title/position/done-state all change in place),
-- so all four carry a real `updated_at` trigger - the same distinction
-- `life_habits`/`life_routines` themselves already draw against their own
-- child log tables.
--
-- Prepared but NOT YET APPLIED to the live Supabase project - the assistant
-- that built this doesn't hold elevated Supabase credentials in this
-- environment, the same "code is real, dashboard/database state is
-- pending" situation as every earlier Life Planner migration. Apply via
-- `supabase db push` or the SQL Editor at supabase.com/dashboard.

create table if not exists public.life_weekly_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, week_start)
);

create index if not exists life_weekly_plans_owner_id_idx on public.life_weekly_plans (owner_id);

alter table public.life_weekly_plans enable row level security;

create policy "Users can read their own weekly plans" on public.life_weekly_plans
  for select to authenticated using (owner_id = auth.uid());

create policy "Users can create their own weekly plans" on public.life_weekly_plans
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can update their own weekly plans" on public.life_weekly_plans
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Users can delete their own weekly plans" on public.life_weekly_plans
  for delete to authenticated using (owner_id = auth.uid());

-- Each table's own trigger function, written fresh rather than shared or
-- retroactively edited from an earlier migration - the same deliberate
-- duplication `set_life_habits_updated_at`/`set_life_routines_updated_at`
-- use.
create function public.set_life_weekly_plans_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_life_weekly_plans_updated
  before update on public.life_weekly_plans
  for each row
  execute function public.set_life_weekly_plans_updated_at();

create table if not exists public.life_weekly_priorities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  weekly_plan_id uuid not null references public.life_weekly_plans (id) on delete cascade,
  title text not null,
  source_type text not null default 'custom' check (source_type in ('goal', 'task', 'custom')),
  source_id uuid,
  is_done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists life_weekly_priorities_owner_id_idx on public.life_weekly_priorities (owner_id);
create index if not exists life_weekly_priorities_weekly_plan_id_idx on public.life_weekly_priorities (weekly_plan_id);

alter table public.life_weekly_priorities enable row level security;

create policy "Users can read their own weekly priorities" on public.life_weekly_priorities
  for select to authenticated using (owner_id = auth.uid());

create policy "Users can create their own weekly priorities" on public.life_weekly_priorities
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can update their own weekly priorities" on public.life_weekly_priorities
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Users can delete their own weekly priorities" on public.life_weekly_priorities
  for delete to authenticated using (owner_id = auth.uid());

create function public.set_life_weekly_priorities_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_life_weekly_priorities_updated
  before update on public.life_weekly_priorities
  for each row
  execute function public.set_life_weekly_priorities_updated_at();

create table if not exists public.life_monthly_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  month_start date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, month_start)
);

create index if not exists life_monthly_plans_owner_id_idx on public.life_monthly_plans (owner_id);

alter table public.life_monthly_plans enable row level security;

create policy "Users can read their own monthly plans" on public.life_monthly_plans
  for select to authenticated using (owner_id = auth.uid());

create policy "Users can create their own monthly plans" on public.life_monthly_plans
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can update their own monthly plans" on public.life_monthly_plans
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Users can delete their own monthly plans" on public.life_monthly_plans
  for delete to authenticated using (owner_id = auth.uid());

create function public.set_life_monthly_plans_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_life_monthly_plans_updated
  before update on public.life_monthly_plans
  for each row
  execute function public.set_life_monthly_plans_updated_at();

create table if not exists public.life_monthly_priorities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  monthly_plan_id uuid not null references public.life_monthly_plans (id) on delete cascade,
  title text not null,
  source_type text not null default 'custom' check (source_type in ('goal', 'task', 'custom')),
  source_id uuid,
  is_done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists life_monthly_priorities_owner_id_idx on public.life_monthly_priorities (owner_id);
create index if not exists life_monthly_priorities_monthly_plan_id_idx on public.life_monthly_priorities (monthly_plan_id);

alter table public.life_monthly_priorities enable row level security;

create policy "Users can read their own monthly priorities" on public.life_monthly_priorities
  for select to authenticated using (owner_id = auth.uid());

create policy "Users can create their own monthly priorities" on public.life_monthly_priorities
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can update their own monthly priorities" on public.life_monthly_priorities
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Users can delete their own monthly priorities" on public.life_monthly_priorities
  for delete to authenticated using (owner_id = auth.uid());

create function public.set_life_monthly_priorities_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_life_monthly_priorities_updated
  before update on public.life_monthly_priorities
  for each row
  execute function public.set_life_monthly_priorities_updated_at();
