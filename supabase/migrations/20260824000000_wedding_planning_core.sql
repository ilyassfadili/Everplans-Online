-- Wedding Planner: the planning core - milestones and tasks, the first
-- real operational data layered onto the workspace created in
-- 20260823000000_wedding_workspace.sql. Both tables are user-created and
-- start empty; nothing here seeds default/example content (Prompt 2's own
-- "do not fabricate completion data" instruction) - a fresh workspace
-- shows real empty states until the couple adds their own milestones and
-- tasks.
--
-- Overall planning progress is deliberately NOT a column anywhere in this
-- migration - it's derived at read time from these two tables
-- (`@/lib/wedding/progress.ts`), never stored, so there is exactly one
-- source of truth for "how far along is this wedding" and it can never
-- drift out of sync with the tasks/milestones it's computed from.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status every migration in this repo starts in. Apply with
-- `supabase db push` or the SQL Editor at https://supabase.com/dashboard.

-- Meaningful planning checkpoints, not micro-tasks - "Book the venue," not
-- "Call venue #3." `sort_order` is caller-assigned (append at the current
-- max + 1) rather than database-managed, the same "the app decides
-- ordering, the database just stores it" split most-favored elsewhere in
-- this schema.
create table if not exists public.wedding_milestones (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'not-started',
  target_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint wedding_milestones_status_valid check (status in ('not-started', 'in-progress', 'completed')),
  constraint wedding_milestones_title_length check (char_length(title) between 1 and 150)
);

create index if not exists wedding_milestones_wedding_id_idx on public.wedding_milestones (wedding_id, sort_order);

alter table public.wedding_milestones enable row level security;

-- No `owner_id` column here - ownership resolves through `wedding_id`'s
-- own owner (`weddings.owner_id`), the same "join back to the owning row"
-- pattern `planner_answers` already uses against `planner_instances`. One
-- combined `for all` policy (not split select/insert/update) because a
-- milestone is freely read/created/edited by its own wedding's owner as a
-- normal part of planning - there's no narrower boundary to enforce within
-- "this is genuinely my own wedding's milestone."
create policy "Users can manage their own wedding milestones"
  on public.wedding_milestones
  for all
  to authenticated
  using (
    exists (select 1 from public.weddings w where w.id = wedding_milestones.wedding_id and w.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.weddings w where w.id = wedding_milestones.wedding_id and w.owner_id = auth.uid())
  );

create function public.set_wedding_milestones_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_wedding_milestones_updated
  before update on public.wedding_milestones
  for each row execute function public.set_wedding_milestones_updated_at();

-- Tasks - the operational layer. `milestone_id` is optional (Phase 3's
-- "Optional milestone/category relationship where appropriate"): a task
-- can group under a milestone or stand alone. `priority`/`due_date` land
-- in this same migration rather than a third one for Phase 4, since both
-- are plain nullable/defaulted columns with no behavior of their own until
-- Phase 4 adds the UI that reads them - adding the columns once, up front,
-- avoids a churny "alter table" migration for what Prompt 2 treats as one
-- continuous feature.
create table if not exists public.wedding_tasks (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  milestone_id uuid references public.wedding_milestones (id) on delete set null,
  title text not null,
  description text,
  status text not null default 'not-started',
  priority text not null default 'medium',
  due_date date,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint wedding_tasks_status_valid check (status in ('not-started', 'in-progress', 'completed')),
  constraint wedding_tasks_priority_valid check (priority in ('low', 'medium', 'high')),
  constraint wedding_tasks_title_length check (char_length(title) between 1 and 150)
);

create index if not exists wedding_tasks_wedding_id_idx on public.wedding_tasks (wedding_id, status);
create index if not exists wedding_tasks_milestone_id_idx on public.wedding_tasks (milestone_id);

alter table public.wedding_tasks enable row level security;

create policy "Users can manage their own wedding tasks"
  on public.wedding_tasks
  for all
  to authenticated
  using (
    exists (select 1 from public.weddings w where w.id = wedding_tasks.wedding_id and w.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.weddings w where w.id = wedding_tasks.wedding_id and w.owner_id = auth.uid())
  );

create function public.set_wedding_tasks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_wedding_tasks_updated
  before update on public.wedding_tasks
  for each row execute function public.set_wedding_tasks_updated_at();
