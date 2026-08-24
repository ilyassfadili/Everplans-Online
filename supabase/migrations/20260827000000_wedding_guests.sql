-- Wedding Planner: guests and RSVP (Prompt 4 Phases 1-2). One table for
-- both - RSVP status is a real, load-bearing column on the guest record
-- itself, not a separate table, since "this guest's RSVP" only ever means
-- one thing and never needs its own history/audit trail in this scope.
--
-- No `household` concept: guests here are individuals, each with their own
-- RSVP status - grouping people who arrive together (a couple, a family)
-- is a genuinely separate concept from "who is invited and have they
-- responded," and Phase 1 is explicit that only concepts genuinely needed
-- by this prompt should be built. `group_label` (free text - "Family,"
-- "College Friends") covers the "relationship/category" concept Phase 1
-- asks for without hardcoding a fixed taxonomy.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status every migration in this repo starts in. Apply with
-- `supabase db push` or the SQL Editor at https://supabase.com/dashboard.

create table if not exists public.wedding_guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  group_label text,
  rsvp_status text not null default 'not-responded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint wedding_guests_first_name_length check (char_length(first_name) between 1 and 100),
  constraint wedding_guests_last_name_length check (char_length(last_name) between 1 and 100),
  constraint wedding_guests_group_label_length check (group_label is null or char_length(group_label) <= 100),
  constraint wedding_guests_rsvp_status_valid check (rsvp_status in ('not-responded', 'attending', 'not-attending'))
);

create index if not exists wedding_guests_wedding_id_idx on public.wedding_guests (wedding_id, last_name, first_name);

alter table public.wedding_guests enable row level security;

-- Same "join back to the owning wedding" pattern as every other Wedding
-- Planner child table (`20260824000000_wedding_planning_core.sql` et al.).
create policy "Users can manage their own wedding guests"
  on public.wedding_guests
  for all
  to authenticated
  using (
    exists (select 1 from public.weddings w where w.id = wedding_guests.wedding_id and w.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.weddings w where w.id = wedding_guests.wedding_id and w.owner_id = auth.uid())
  );

create function public.set_wedding_guests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_wedding_guests_updated
  before update on public.wedding_guests
  for each row execute function public.set_wedding_guests_updated_at();
