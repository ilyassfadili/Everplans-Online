-- Home Planner (Product #4) - Recurring Tasks (Everplans Home Planner
-- Prompt 3 Phase 2: "prevent users from having to manually recreate
-- routine tasks").
--
-- Extends `public.home_maintenance_tasks` in place - the same "one table,
-- new columns" shape `home_inventory_items.is_important` already
-- establishes for Important Items, not a second recurrence engine (Phase
-- 2's own instruction: "do not create a separate recurrence engine").
--
-- `recurrence_frequency is null` means "not recurring" - the common case,
-- and the default every task already has. `series_root_id` links every
-- *generated* occurrence back to the very first task in its series (the
-- root itself has `series_root_id is null` - it IS the root), so "every
-- occurrence of this series" is a simple query on `coalesce(series_root_id, id)`
-- without walking a chain.
--
-- Occurrences are generated lazily, one at a time, when the current one is
-- completed (`completeMaintenanceTask`, `@/lib/home-planner/maintenance`) -
-- there is never more than one *open* occurrence per series at once. The
-- partial unique index below is what makes "avoid creating duplicate
-- occurrences" (Phase 2's own requirement) a real database guarantee, not
-- just an application-level check: a concurrent double-completion racing
-- to generate the next occurrence hits `23505` on the second attempt,
-- caught and treated as "already generated" (the same fallback
-- `createHome`/`createTrip` already establish for their own unique
-- constraints).
alter table public.home_maintenance_tasks
  add column if not exists recurrence_frequency text,
  add column if not exists recurrence_interval_days integer,
  add column if not exists recurrence_active boolean not null default true,
  add column if not exists series_root_id uuid references public.home_maintenance_tasks (id) on delete set null;

alter table public.home_maintenance_tasks
  add constraint home_maintenance_tasks_recurrence_frequency_valid check (
    recurrence_frequency is null or recurrence_frequency in ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom')
  ),
  add constraint home_maintenance_tasks_recurrence_interval_valid check (
    recurrence_interval_days is null or recurrence_interval_days between 1 and 3650
  ),
  -- "Custom" recurrence is meaningless without an interval to repeat by;
  -- every other frequency already has a fixed real-world meaning.
  add constraint home_maintenance_tasks_custom_interval_required check (
    recurrence_frequency is distinct from 'custom' or recurrence_interval_days is not null
  );

create index if not exists home_maintenance_tasks_series_root_id_idx on public.home_maintenance_tasks (series_root_id);

create unique index if not exists home_maintenance_tasks_series_one_open_idx
  on public.home_maintenance_tasks (coalesce(series_root_id, id))
  where completed_at is null and recurrence_frequency is not null;
