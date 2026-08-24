-- Life Planner (Product #5) - Life Areas.
--
-- Everplans Life Planner Prompt 2 Phase 1 scope: `public.life_areas`, the
-- first child table of `public.life_plans`
-- (`supabase/migrations/20260911000000_life_planner_foundation.sql`). Every
-- account gets its own set of areas the moment their workspace exists - the
-- 9 defaults (Personal, Career, Education, Finance, Health & Wellness,
-- Relationships, Home, Travel, Other) are seeded app-side by
-- `ensureDefaultLifeAreas` (`@/lib/life-planner/life-areas`), not by this
-- migration, so each user's rows stay independently editable/deletable from
-- day one rather than being a shared, uneditable catalog.
--
-- Unlike `life_plans` (one row per owner, no delete policy), `life_areas` is
-- a genuine one-to-many list with a delete policy - a user can remove a
-- default area they don't want, or a custom one they added, the only
-- constraint (enforced app-side in `deleteLifeArea`, not by the database)
-- being that it can never take someone down to zero areas.
--
-- Prepared but NOT YET APPLIED to the live Supabase project - the assistant
-- that built this doesn't hold elevated Supabase credentials in this
-- environment, the same "code is real, dashboard/database state is
-- pending" situation as `20260911000000_life_planner_foundation.sql`. Apply
-- via `supabase db push` or the SQL Editor at supabase.com/dashboard.
create table if not exists public.life_areas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null references public.life_plans (id) on delete cascade,
  name text not null,
  description text,
  icon_key text not null default 'other',
  color_key text not null default 'neutral',
  is_custom boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists life_areas_owner_id_idx on public.life_areas (owner_id);
create index if not exists life_areas_plan_id_idx on public.life_areas (plan_id);

alter table public.life_areas enable row level security;

-- Narrow per-operation policies, each scoped directly to
-- `owner_id = auth.uid()` - the same shape `life_plans`' own policies use,
-- plus a delete policy (`life_plans` deliberately has none; `life_areas`
-- deliberately does, per this migration's own header comment).
create policy "Users can read their own life areas" on public.life_areas
  for select to authenticated using (owner_id = auth.uid());

create policy "Users can create their own life areas" on public.life_areas
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can update their own life areas" on public.life_areas
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Users can delete their own life areas" on public.life_areas
  for delete to authenticated using (owner_id = auth.uid());

-- Each table's own trigger function, written fresh rather than shared or
-- retroactively edited from an earlier migration - the same deliberate
-- duplication `set_life_plans_updated_at` uses.
create function public.set_life_areas_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_life_areas_updated
  before update on public.life_areas
  for each row
  execute function public.set_life_areas_updated_at();
