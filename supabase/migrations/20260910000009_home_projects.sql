-- Home Planner (Product #4) - Home Projects (Everplans Home Planner
-- Prompt 4 Phase 3: "What am I working on, what needs to happen next, and
-- where does the project stand?").
--
-- `public.home_projects` is a child table of `public.homes`, the same
-- shape `home_rooms`/`home_maintenance_tasks`/`home_bills` establish
-- (nullable `room_id`, `on delete set null` - removing a room unassigns a
-- project rather than deleting it). Unlike Maintenance/Bills, `status`
-- here IS a stored column, not derived - Planning/In Progress/On Hold/
-- Completed is a state the user chooses directly, not something computed
-- from a due date.
create table if not exists public.home_projects (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  room_id uuid references public.home_rooms (id) on delete set null,
  name text not null,
  description text,
  category text not null default 'other',
  status text not null default 'planning',
  start_date date,
  target_completion_date date,
  -- Integer cents (this codebase's one money convention). Kept
  -- deliberately simple (Phase 3's own instruction: "do not build a
  -- complete accounting system") - a planned figure and a manually-entered
  -- spent-so-far figure, not a full expense ledger.
  budget_planned_cents integer,
  budget_used_cents integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint home_projects_name_length check (char_length(name) between 1 and 150),
  constraint home_projects_description_length check (description is null or char_length(description) <= 1000),
  constraint home_projects_category_valid check (
    category in ('renovation', 'repair', 'decoration', 'furniture', 'garden', 'improvement', 'other')
  ),
  constraint home_projects_status_valid check (status in ('planning', 'in_progress', 'on_hold', 'completed')),
  constraint home_projects_budget_planned_valid check (budget_planned_cents is null or budget_planned_cents >= 0),
  constraint home_projects_budget_used_valid check (budget_used_cents is null or budget_used_cents >= 0),
  constraint home_projects_notes_length check (notes is null or char_length(notes) <= 2000)
);

create index if not exists home_projects_home_id_idx on public.home_projects (home_id);
create index if not exists home_projects_room_id_idx on public.home_projects (room_id);

alter table public.home_projects enable row level security;

create policy "Users can manage their own projects" on public.home_projects
  for all to authenticated
  using (exists (select 1 from public.homes h where h.id = home_projects.home_id and h.owner_id = auth.uid()))
  with check (exists (select 1 from public.homes h where h.id = home_projects.home_id and h.owner_id = auth.uid()));

create function public.set_home_projects_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_home_projects_updated
  before update on public.home_projects
  for each row
  execute function public.set_home_projects_updated_at();

-- Project tasks - unlike `room_id`/etc, this is a real ownership FK
-- (`on delete cascade`, not `set null`): a task has no meaning outside its
-- parent project, the same "deleting the project deletes its tasks"
-- relationship `wedding_tasks` has with `weddings`. Progress is derived
-- from these rows at read time (`@/lib/home-planner/project-progress.ts`),
-- never stored on `home_projects` itself - the same "derived, never
-- stored" rule this product's other computed metrics already follow, so
-- it can never drift out of sync with actual task completion (Phase 3's
-- own instruction: "do not create meaningless or manually manipulated
-- metrics").
create table if not exists public.home_project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.home_projects (id) on delete cascade,
  name text not null,
  is_completed boolean not null default false,
  due_date date,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint home_project_tasks_name_length check (char_length(name) between 1 and 150),
  constraint home_project_tasks_notes_length check (notes is null or char_length(notes) <= 1000)
);

create index if not exists home_project_tasks_project_id_idx on public.home_project_tasks (project_id, sort_order);

alter table public.home_project_tasks enable row level security;

-- A single `for all` policy on this child table, the same convention
-- `trip_days` (Travel Planner) establishes for a pure two-levels-deep
-- child table: a correlated subquery through `home_projects` up to
-- `homes.owner_id`.
create policy "Users can manage their own project tasks" on public.home_project_tasks
  for all to authenticated
  using (
    exists (
      select 1 from public.home_projects p
      join public.homes h on h.id = p.home_id
      where p.id = home_project_tasks.project_id and h.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.home_projects p
      join public.homes h on h.id = p.home_id
      where p.id = home_project_tasks.project_id and h.owner_id = auth.uid()
    )
  );

create function public.set_home_project_tasks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_home_project_tasks_updated
  before update on public.home_project_tasks
  for each row
  execute function public.set_home_project_tasks_updated_at();
