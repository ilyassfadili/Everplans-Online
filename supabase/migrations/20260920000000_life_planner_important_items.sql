-- Life Planner (Product #5) - Important Plans & Information (Life Planner
-- Prompt 4 Phase 3). `public.life_important_items` - a free-form reference
-- record a user keeps close: a plan worth remembering, an intention, a
-- milestone note, a reference detail, or a plain note - `title` + `content`,
-- optionally filed under one of their own Life Areas and/or linked to one of
-- their own Goals (both optional, nullable filing references, not ownership
-- relationships - the same "sibling, not child" shape `life_journal_entries`
-- already establishes for the same two fields, `on delete set null` on both
-- FKs so removing an area or a goal never deletes or orphans-invalidly an
-- item filed under it). `category` distinguishes what kind of "important
-- thing" this is - a plan, an intention, a milestone note, a reference
-- detail, a plain note, or "other" - purely a label for browsing/filtering,
-- no behavioral difference between categories. `is_archived` is this
-- table's soft-delete affordance, the same primary "remove from view" role
-- `life_journal_entries.is_archived` plays; a plain hard delete also exists
-- for genuine removal, offered alongside archive rather than instead of it,
-- the same "archive AND delete, not archive OR delete" shape
-- `life_journal_entries`/`life_tasks` use.
--
-- This is private personal data - not a shared plan or checklist, and not
-- meant for another party (a partner, a vendor, a household member) to ever
-- see. Every policy below is scoped to a single, direct
-- `owner_id = auth.uid()` check - no broader "authenticated" read, no
-- sharing/collaboration table joins in (none exist for Life Planner at all
-- today), and there is NO service-role or `security definer` escape hatch
-- anywhere for this table, the same "RLS is not one layer of this table's
-- access control, it is the *only* layer" rigor
-- `20260919000000_life_planner_journal.sql` documents for Journal.
--
-- Prepared but NOT YET APPLIED to the live Supabase project - the assistant
-- that built this doesn't hold elevated Supabase credentials in this
-- environment, the same "code is real, dashboard/database state is
-- pending" situation as every earlier Life Planner migration. Apply via
-- `supabase db push` or the SQL Editor at supabase.com/dashboard.

create table if not exists public.life_important_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content text not null,
  category text not null default 'note' check (category in ('plan', 'intention', 'milestone', 'reference', 'note', 'other')),
  life_area_id uuid references public.life_areas (id) on delete set null,
  goal_id uuid references public.life_goals (id) on delete set null,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists life_important_items_owner_id_idx on public.life_important_items (owner_id);
create index if not exists life_important_items_category_idx on public.life_important_items (category);
create index if not exists life_important_items_life_area_id_idx on public.life_important_items (life_area_id);
create index if not exists life_important_items_goal_id_idx on public.life_important_items (goal_id);

alter table public.life_important_items enable row level security;

-- Four separate, single-purpose policies (not one combined `for all`), the
-- same per-operation shape every other Life Planner root table uses, kept
-- here rather than collapsed to a shorter `for all` for the same "easy to
-- audit at a glance, one operation at a time" reasoning
-- `life_journal_entries` documents for this schema's other most-sensitive
-- table.
create policy "Users can read their own important items" on public.life_important_items
  for select to authenticated using (owner_id = auth.uid());

create policy "Users can create their own important items" on public.life_important_items
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can update their own important items" on public.life_important_items
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Users can delete their own important items" on public.life_important_items
  for delete to authenticated using (owner_id = auth.uid());

-- This table's own trigger function, written fresh rather than shared or
-- retroactively edited from an earlier migration - the same deliberate
-- duplication `set_life_journal_entries_updated_at`/`set_life_habits_updated_at`
-- use.
create function public.set_life_important_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_life_important_items_updated
  before update on public.life_important_items
  for each row
  execute function public.set_life_important_items_updated_at();
