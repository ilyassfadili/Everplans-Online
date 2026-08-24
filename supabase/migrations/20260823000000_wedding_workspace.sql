-- Wedding Planner: the workspace itself - one row per couple's wedding,
-- owned by the account that created it.
--
-- Deliberately its own table, not a row in `planner_definitions`/an
-- instance in `planner_instances`: those tables are the generic,
-- content-agnostic downloadable-planner marketplace (buy/entitlement/fill
-- a linear Q&A form - see that system's own migrations and
-- `src/lib/planners.ts`'s explicit "never add a weddingDate field here"
-- warning). The Wedding Planner is a real, purpose-built product with its
-- own relational shape (tasks with independent status/priority/due dates,
-- milestones - see `20260824000000_wedding_planning_core.sql`) that the
-- marketplace's flat field-answer model cannot represent. It shares only
-- the layers that are genuinely generic: auth, the Supabase clients, the
-- `(app)` shell, and the design system - never the marketplace's own
-- tables.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status every migration in this repo starts in. Apply with
-- `supabase db push` or the SQL Editor at https://supabase.com/dashboard.

create table if not exists public.weddings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  partner_one_name text not null,
  partner_two_name text not null,
  -- Nullable: onboarding explicitly allows "we haven't decided yet" rather
  -- than forcing a placeholder date.
  wedding_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One workspace per account - the actual duplicate-workspace guard.
  -- Onboarding's Server Action still checks-before-insert for a fast,
  -- friendly redirect, but this constraint is what makes a race (double
  -- submit, two tabs) fail safely at the database layer rather than
  -- silently creating a second workspace.
  constraint weddings_owner_unique unique (owner_id),
  constraint weddings_partner_one_name_length check (char_length(partner_one_name) between 1 and 100),
  constraint weddings_partner_two_name_length check (char_length(partner_two_name) between 1 and 100)
);

create index if not exists weddings_owner_id_idx on public.weddings (owner_id);

alter table public.weddings enable row level security;

-- Strict per-row ownership, split into narrow policies (the `profiles`
-- pattern) rather than one broad one: a user may read, create, and update
-- only their own wedding workspace. No delete policy - removing a
-- workspace isn't in scope for this product yet.
create policy "Users can read their own wedding"
  on public.weddings
  for select
  to authenticated
  using (owner_id = auth.uid());

create policy "Users can create their own wedding"
  on public.weddings
  for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Users can update their own wedding"
  on public.weddings
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create function public.set_weddings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_weddings_updated
  before update on public.weddings
  for each row execute function public.set_weddings_updated_at();
