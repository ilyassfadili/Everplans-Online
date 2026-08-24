-- Application-level user profile.
--
-- Not strictly needed to display anything today - `full_name` already
-- lives in `auth.users.user_metadata` and the dashboard already reads it
-- from there correctly (see src/app/(app)/app/page.tsx). This table
-- exists for a different, genuine reason: `auth.users` lives in the
-- `auth` schema, is not directly queryable/joinable through RLS the way
-- an ordinary `public` table is, and every future user-owned table
-- (starting with nothing today, but including whatever the planner
-- runtime's customer-state work eventually needs) requires a stable
-- `public`-schema id to hold a foreign key against. `profiles.id`
-- mirroring `auth.users.id` is that stable reference point - this table
-- is infrastructure for ownership, not a feature in its own right.
--
-- `display_name` duplicates `user_metadata.full_name` deliberately, as a
-- literal copy rather than a derived/computed value - `user_metadata` is
-- caller-editable Auth data (any successful `supabase.auth.updateUser()`
-- call can rewrite it), not itself an ownership-safe source of truth for
-- an RLS-governed application table to depend on implicitly. The trigger
-- below seeds it once at signup from the same value sign-up already
-- collects; from then on it's this table's own column, updated only
-- through this table's own (owner-only, RLS-enforced) update path.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status as supabase/migrations/20260818000000_contact_submissions.sql
-- and 20260819000000_planner_definitions.sql. Apply with the Supabase
-- CLI (`supabase db push`) or the SQL Editor at
-- https://supabase.com/dashboard.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_display_name_length check (display_name is null or char_length(display_name) between 1 and 200)
);

alter table public.profiles enable row level security;

-- Strict per-row ownership: `auth.uid()` is the authenticated caller's own
-- id, resolved by Supabase from the request's JWT - never a value the
-- client supplies or can influence. Four narrow policies rather than one
-- broad one, so each operation's boundary is independently reviewable:
-- a user may read and update their own row only, and may neither read
-- nor write anyone else's. There is deliberately no insert policy for
-- `authenticated` - rows are created exclusively by the trigger below
-- (as `security definer`, i.e. running with the privileges of the
-- function's owner, not the calling user), so a client can never insert
-- a profile with an id that isn't its own, or insert one at all outside
-- the signup flow. There is also no delete policy - a profile is removed
-- only via `on delete cascade` when the underlying auth.users row itself
-- is deleted, never as a standalone action.
create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Auto-creates a profile row the moment a new auth.users row is inserted
-- - the standard Supabase pattern for keeping a public-schema mirror row
-- in sync with Auth without the application having to remember to do it
-- on every signup path (email/password, Google OAuth - both insert into
-- auth.users the same way, so both are covered by one trigger rather than
-- needing separate handling in src/app/(auth)/sign-up/actions.ts and the
-- OAuth callback route). `security definer` is what lets this function
-- write to `public.profiles` despite the strict owner-only RLS policies
-- above - it runs as the function's owner, not as the new user (who has
-- no session yet at the moment their own row is being created).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keeps `updated_at` honest at the database layer rather than trusting
-- every future call site to remember to set it - the same "let Postgres
-- enforce what it safely can" principle the RLS policies above follow.
-- Scoped to `profiles` specifically (not a shared/generic trigger
-- function reused across tables) because no other table in this schema
-- has an `updated_at` column that needs it yet; a shared helper is easy
-- to add once a second table actually needs one.
create function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();
