-- Life Planner (Product #5) - life plan workspace foundation.
--
-- Same shape as `20260907000000_travel_planner_foundation.sql`: a
-- hand-built product gets its own purpose-built table, not an instance of
-- the generic `planner_definitions`/`planner_instances` marketplace
-- (`@/types/wedding`'s own comment explains why that split exists).
-- `public.life_plans` is Life Planner's root workspace - one row per
-- account, the same "workspace exists yet?" gate
-- `getWeddingForCurrentUser()`/`getTripForCurrentUser()`/`getHomeForCurrentUser()`
-- already use to decide onboarding vs. workspace. Free-to-start, gated
-- purely on this row's existence - no `planner_definitions`/entitlements
-- row, same as Travel/Home/Wedding/Budget.
--
-- Everplans Life Planner Prompt 1 scope only: the root workspace row and
-- its Life Profile text fields (identity, priorities, important areas,
-- short/long-term direction, planning preferences) - all nullable, since
-- Prompt 1 only auto-provisions a bare row on first visit; Prompt 2 owns
-- the actual Life Profile form + validation that fills them in. No
-- `life_areas`/`life_goals`/`life_tasks`/`life_habits`/etc. tables yet -
-- those are later prompts' scope, deliberately absent rather than
-- scaffolded ahead of time.
--
-- Prepared but NOT YET APPLIED to the live Supabase project - the assistant
-- that built this doesn't hold elevated Supabase credentials in this
-- environment, the same "code is real, dashboard/database state is
-- pending" situation as `20260818000000_contact_submissions.sql`. Apply via
-- `supabase db push` or the SQL Editor at supabase.com/dashboard.
create table if not exists public.life_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  planning_identity text,
  current_priorities text,
  important_areas text,
  short_term_direction text,
  long_term_direction text,
  planning_preferences text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint life_plans_owner_unique unique (owner_id)
);

create index if not exists life_plans_owner_id_idx on public.life_plans (owner_id);

alter table public.life_plans enable row level security;

-- Narrow per-operation policies on the root workspace table (no delete
-- policy - removing a workspace isn't in scope, same as `trips`/`weddings`),
-- each scoped directly to `owner_id = auth.uid()`.
create policy "Users can read their own life plan" on public.life_plans
  for select to authenticated using (owner_id = auth.uid());

create policy "Users can create their own life plan" on public.life_plans
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can update their own life plan" on public.life_plans
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Each table's own trigger function, written fresh rather than shared or
-- retroactively edited from an earlier migration - the same deliberate
-- duplication `set_trips_updated_at`/`set_weddings_updated_at` use.
create function public.set_life_plans_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_life_plans_updated
  before update on public.life_plans
  for each row
  execute function public.set_life_plans_updated_at();
