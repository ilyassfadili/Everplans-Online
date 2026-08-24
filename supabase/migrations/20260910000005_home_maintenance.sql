-- Home Planner (Product #4) - Maintenance system (Everplans Home Planner
-- Prompt 3 Phase 1: "What needs attention around my home?").
--
-- `public.home_maintenance_tasks` is a child table of `public.homes` - the
-- same shape `home_rooms`/`home_inventory_items` already establish.
-- `room_id` is nullable with `on delete set null` (same reasoning
-- `home_inventory_items.room_id` already documents): removing a room must
-- unassign its maintenance tasks, never delete them.
--
-- Deliberately no stored `status` column. "Upcoming / Due / Completed /
-- Overdue" (Phase 1's own status model) is derived at read time from
-- `completed_at` and `due_date` (`@/lib/home-planner/maintenance-status.ts`'s
-- `calculateMaintenanceStatus`) - the same "derived, never stored" rule
-- `HomeSetupProgress`/`TripSetupProgress` already follow, so a task's
-- displayed status can never drift out of sync with its own dates (no
-- background job exists in this environment to flip a stored status when
-- a due date passes). `completed_at` itself is the one real, stored fact:
-- `null` means open, a timestamp means completed - marking/reopening a
-- task is exactly setting/clearing this one column.
create table if not exists public.home_maintenance_tasks (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  room_id uuid references public.home_rooms (id) on delete set null,
  name text not null,
  description text,
  category text not null default 'general',
  priority text not null default 'medium',
  due_date date,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint home_maintenance_tasks_name_length check (char_length(name) between 1 and 150),
  constraint home_maintenance_tasks_description_length check (description is null or char_length(description) <= 1000),
  constraint home_maintenance_tasks_category_valid check (
    category in ('hvac', 'plumbing', 'electrical', 'appliances', 'cleaning', 'safety', 'exterior', 'garden', 'general', 'other')
  ),
  constraint home_maintenance_tasks_priority_valid check (priority in ('low', 'medium', 'high')),
  constraint home_maintenance_tasks_notes_length check (notes is null or char_length(notes) <= 2000)
);

create index if not exists home_maintenance_tasks_home_id_idx on public.home_maintenance_tasks (home_id);
create index if not exists home_maintenance_tasks_room_id_idx on public.home_maintenance_tasks (room_id);

alter table public.home_maintenance_tasks enable row level security;

-- A single `for all` policy on this child table, the same convention
-- `home_rooms`/`home_inventory_items` establish.
create policy "Users can manage their own maintenance tasks" on public.home_maintenance_tasks
  for all to authenticated
  using (exists (select 1 from public.homes h where h.id = home_maintenance_tasks.home_id and h.owner_id = auth.uid()))
  with check (exists (select 1 from public.homes h where h.id = home_maintenance_tasks.home_id and h.owner_id = auth.uid()));

create function public.set_home_maintenance_tasks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_home_maintenance_tasks_updated
  before update on public.home_maintenance_tasks
  for each row
  execute function public.set_home_maintenance_tasks_updated_at();
