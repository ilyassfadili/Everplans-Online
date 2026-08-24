-- Life Planner (Product #5) - Journal (Life Planner Prompt 4 Phase 2).
-- `public.life_journal_entries` - a free-form, dated reflection a user
-- writes for themselves: `title` + `content`, optionally filed under one of
-- their own Life Areas and/or linked to one of their own Goals (both
-- optional, nullable filing references, not ownership relationships - the
-- same "sibling, not child" shape `life_tasks.life_area_id`/`goal_id`
-- already establish, `on delete set null` on both FKs so removing an area
-- or a goal never deletes or orphans-invalidly an entry filed under it).
-- `entry_date` defaults to the day the entry is created but is editable
-- (a reflection written today about yesterday) - always the calendar day
-- the entry is *dated to*, not a timestamp. `is_archived` is this table's
-- soft-delete affordance, the primary "remove from view" path (the same
-- role `life_tasks.is_archived` plays); a plain hard delete also exists for
-- genuine removal, offered alongside archive rather than instead of it, the
-- same "archive AND delete, not archive OR delete" shape `life_tasks` uses.
--
-- THIS IS THE MOST SENSITIVE TABLE IN THE ENTIRE PRODUCT. A journal entry is
-- private reflective writing - not a shared plan, not a checklist, not
-- anything another party (a partner, a vendor, a household member) is ever
-- meant to see. Every policy below is scoped to a single, direct
-- `owner_id = auth.uid()` check - no broader "authenticated" read, no
-- sharing/collaboration table joins in (none exist for Life Planner at all
-- today), and unlike the commerce tables elsewhere in this schema
-- (`commerce_operators`/`commerce_ops_audit_log`, see
-- `20260819000003_commerce_provisioning.sql`), there is NO service-role or
-- `security definer` escape hatch anywhere for this table - RLS is not one
-- layer of this table's access control, it is the *only* layer. If a future
-- feature ever needs an admin/ops view into this data, that is a decision
-- requiring its own explicit review, not something to bolt on quietly here.
--
-- Prepared but NOT YET APPLIED to the live Supabase project - the assistant
-- that built this doesn't hold elevated Supabase credentials in this
-- environment, the same "code is real, dashboard/database state is
-- pending" situation as every earlier Life Planner migration. Apply via
-- `supabase db push` or the SQL Editor at supabase.com/dashboard.

create table if not exists public.life_journal_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content text not null,
  entry_date date not null default current_date,
  life_area_id uuid references public.life_areas (id) on delete set null,
  goal_id uuid references public.life_goals (id) on delete set null,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists life_journal_entries_owner_id_idx on public.life_journal_entries (owner_id);
create index if not exists life_journal_entries_entry_date_idx on public.life_journal_entries (entry_date);
create index if not exists life_journal_entries_life_area_id_idx on public.life_journal_entries (life_area_id);
create index if not exists life_journal_entries_goal_id_idx on public.life_journal_entries (goal_id);

alter table public.life_journal_entries enable row level security;

-- Four separate, single-purpose policies (not one combined `for all`) so
-- each operation's own `using`/`with check` clause is as narrow and
-- legible as possible for the most sensitive table in this schema - the
-- same per-operation shape every other Life Planner root table
-- (`life_goals`, `life_tasks`, `life_weekly_plans`, ...) already uses, kept
-- here rather than collapsed to a shorter `for all` specifically because
-- this table's access control deserves to be easy to audit at a glance,
-- one operation at a time.
create policy "Users can read their own journal entries" on public.life_journal_entries
  for select to authenticated using (owner_id = auth.uid());

create policy "Users can create their own journal entries" on public.life_journal_entries
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can update their own journal entries" on public.life_journal_entries
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Users can delete their own journal entries" on public.life_journal_entries
  for delete to authenticated using (owner_id = auth.uid());

-- This table's own trigger function, written fresh rather than shared or
-- retroactively edited from an earlier migration - the same deliberate
-- duplication `set_life_weekly_plans_updated_at`/`set_life_habits_updated_at`
-- use.
create function public.set_life_journal_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_life_journal_entries_updated
  before update on public.life_journal_entries
  for each row
  execute function public.set_life_journal_entries_updated_at();
