-- Generic product entitlements.
--
-- The "does this user have access to this planner" relationship, kept
-- deliberately independent of how access was ever granted - there is no
-- Stripe/Etsy/payment-provider column here, on purpose (see PROMPT 6's
-- own scope boundary and `src/types/entitlement.ts`'s comment). A future
-- commerce integration inserts rows into this same table after a purchase
-- completes; this migration has no opinion on how a row comes to exist.
--
-- No grant/revoke mechanism is created by this migration - PROMPT 6
-- Phase 1 §7 is explicit not to build one "unless the architecture
-- requires a minimal internal administrative/server boundary," and
-- nothing here does yet. Entitlements can only be created, updated, or
-- deleted via the Supabase dashboard's table editor (service_role
-- bypasses RLS), the same "no admin CMS in the application itself"
-- pattern already applied to `planner_definitions`
-- (20260819000000_planner_definitions.sql).
--
-- No seed data - zero entitlement rows, matching every other migration in
-- this repo's "written, not yet pushed, and genuinely empty" status. See
-- 20260818000000_contact_submissions.sql for the apply instructions
-- (`supabase db push` or the SQL Editor).

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  planner_id uuid not null references public.planner_definitions (id) on delete cascade,
  status text not null default 'active',
  granted_at timestamptz not null default now(),
  -- `null` = does not expire. A real integrity guarantee PostgreSQL can
  -- enforce for free: nothing application-side has to remember that
  -- "no expiration" means null rather than some sentinel date.
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint entitlements_status_valid check (status in ('active', 'expired', 'revoked')),
  -- One entitlement per user per planner - a real integrity guarantee,
  -- not merely an application-level assumption. Also what
  -- `getActiveEntitlement` (src/lib/entitlements.ts) relies on to safely
  -- use `.maybeSingle()` instead of handling an ambiguous multi-row result.
  constraint entitlements_user_planner_unique unique (user_id, planner_id)
);

-- The real access-pattern index: "get this user's entitlements" is the
-- only query shape the application performs (see
-- `getActiveEntitlement`) - `entitlements_user_planner_unique` above
-- already creates a composite index that also serves single-planner
-- lookups scoped to a user, so no separate index is added here.
create index if not exists entitlements_user_id_idx on public.entitlements (user_id);

alter table public.entitlements enable row level security;

-- Read-only, own-rows-only, and that's the entire policy surface -
-- exactly the boundary PROMPT 6 Phase 1 §7 lists explicitly: a user may
-- view their own entitlements, and may not view another user's, create
-- one for themselves or anyone else, modify a status, revoke their own
-- access, or repoint an entitlement at a different planner. No insert,
-- update, or delete policy exists for `anon` or `authenticated` at all -
-- every one of those operations is therefore impossible through the
-- publishable-key clients (`src/lib/supabase/client.ts`, `server.ts`),
-- full stop, not merely unlisted by the current UI.
create policy "Users can read their own entitlements"
  on public.entitlements
  for select
  to authenticated
  using (user_id = auth.uid());

-- Same "let Postgres enforce what it safely can" trigger pattern as
-- profiles (20260819000001_profiles.sql) - its own function rather than
-- a shared one, since retroactively editing an already-written migration
-- to extract a shared helper is a more invasive change than one more
-- small, table-scoped function (see this file's own review notes).
create function public.set_entitlements_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_entitlements_updated
  before update on public.entitlements
  for each row execute function public.set_entitlements_updated_at();
