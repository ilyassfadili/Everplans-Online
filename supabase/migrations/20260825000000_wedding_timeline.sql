-- Wedding Planner: important dates - the user-created half of the
-- timeline. The wedding date itself is NOT duplicated here: it already
-- lives on `weddings.wedding_date` (20260823000000_wedding_workspace.sql),
-- and the timeline UI merges that one value with these rows at read time
-- (`@/lib/wedding/timeline.ts`) rather than storing it twice.
--
-- No `status` column: "upcoming/today/past" is derived from `event_date`
-- against the current date at render time - a stored status would just be
-- a second, driftable copy of what the date itself already tells you.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status every migration in this repo starts in. Apply with
-- `supabase db push` or the SQL Editor at https://supabase.com/dashboard.

create table if not exists public.wedding_important_dates (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  title text not null,
  description text,
  event_date date not null,
  -- Nullable: most important dates ("send invitations") only need a day,
  -- not a time - forcing one would misrepresent precision that doesn't
  -- exist.
  event_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint wedding_important_dates_title_length check (char_length(title) between 1 and 150)
);

create index if not exists wedding_important_dates_wedding_id_idx
  on public.wedding_important_dates (wedding_id, event_date);

alter table public.wedding_important_dates enable row level security;

-- Same "join back to the owning wedding" pattern as milestones/tasks
-- (`20260824000000_wedding_planning_core.sql`) - no `owner_id` column
-- here, ownership resolves through `wedding_id`.
create policy "Users can manage their own wedding important dates"
  on public.wedding_important_dates
  for all
  to authenticated
  using (
    exists (select 1 from public.weddings w where w.id = wedding_important_dates.wedding_id and w.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.weddings w where w.id = wedding_important_dates.wedding_id and w.owner_id = auth.uid())
  );

create function public.set_wedding_important_dates_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_wedding_important_dates_updated
  before update on public.wedding_important_dates
  for each row execute function public.set_wedding_important_dates_updated_at();
