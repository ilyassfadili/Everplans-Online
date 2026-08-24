-- Future commerce provisioning boundary.
--
-- PROMPT 7 Phase 1 asks for a real, secure boundary a future commerce
-- integration could plug into - not a paper contract. This migration is
-- that boundary made concrete: an idempotency ledger, and the only two
-- functions ever allowed to write to `public.entitlements`. Nothing here
-- is wired to any caller - no adapter, no webhook route, no SDK - so
-- this is architecture with zero writers today, exactly matching
-- PROMPT 7's "commerce-ready, not commerce-enabled" objective.
--
-- Why a Postgres function instead of just letting the server-side
-- Supabase client (`src/lib/supabase/server.ts`) insert/update directly:
-- `entitlements`' RLS policy (20260819000002_entitlements.sql) grants
-- NO insert/update to `anon` or `authenticated` at all - by design, so a
-- signed-in user's own session can never write its own entitlement rows,
-- even through server-side code using the publishable key. A direct
-- insert from application code would therefore always fail under RLS,
-- which is correct: it would mean the *user's own session* performed a
-- privileged operation. `security definer` functions are the standard,
-- correct Postgres/Supabase pattern for "a specific, narrow, audited
-- operation may bypass RLS, everything else may not" - the function runs
-- with the privileges of whoever created it (this migration, effectively
-- the project owner), not the caller's session, while `revoke execute`
-- below ensures the only caller who can ever invoke it is `service_role`
-- (a privileged key that must never reach the browser - see
-- `src/lib/env.ts` and every prior prompt's "never expose service-role"
-- requirement). A future commerce adapter (a server-only webhook route,
-- never built here) would be the one place in the whole application
-- authorized to call these.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status as every other migration in this repo. Apply with the Supabase
-- CLI (`supabase db push`) or the SQL Editor at
-- https://supabase.com/dashboard.

-- The idempotency ledger PROMPT 7 Phase 1 §4 asks for: "unique external
-- event/reference identification, safe repeated processing, duplicate-
-- event detection." Deliberately NOT an orders/payments/purchases table -
-- it carries no product, price, or customer-identifying detail, only
-- enough to answer one question: "has this exact external event already
-- been processed?" That's the entire scope PROMPT 7 Phase 1 §6 allows
-- ("prefer a clean boundary over speculative schema").
create table if not exists public.commerce_event_log (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_event_id text not null,
  processed_at timestamptz not null default now(),

  -- The actual idempotency guarantee - a duplicate (source, external_event_id)
  -- pair cannot be logged twice, which is what `grant_planner_entitlement`/
  -- `revoke_planner_entitlement` below rely on to detect a replay.
  constraint commerce_event_log_source_event_unique unique (source, external_event_id)
);

-- No user-identifying column exists on this table at all (source + an
-- opaque external event id only), so there's no per-user boundary for a
-- policy to express - RLS is still enabled with zero policies, the same
-- "structurally impossible through the publishable-key clients, not
-- merely unlisted" property every other table in this schema has for
-- operations nothing should perform.
alter table public.commerce_event_log enable row level security;

/**
 * Grants (or re-activates) a user's entitlement to a planner. The only
 * write path to `public.entitlements` that can ever succeed from outside
 * a direct database session - see this file's own top comment for why a
 * function exists at all rather than a plain insert.
 *
 * Idempotent by construction: logs `(p_source, p_external_event_id)`
 * into `commerce_event_log` first; if that pair was already logged (a
 * duplicate delivery), returns the entitlement as it currently stands
 * without re-applying the grant. A safe no-op, not an error - a future
 * provider redelivering the same event is expected behavior, not a bug
 * to reject.
 */
create function public.grant_planner_entitlement(
  p_user_id uuid,
  p_planner_id uuid,
  p_external_event_id text,
  p_source text,
  p_expires_at timestamptz default null
)
returns public.entitlements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted_log_id uuid;
  v_entitlement public.entitlements;
begin
  insert into public.commerce_event_log (source, external_event_id)
  values (p_source, p_external_event_id)
  on conflict (source, external_event_id) do nothing
  returning id into v_inserted_log_id;

  if v_inserted_log_id is null then
    -- Duplicate delivery - already processed, don't re-apply.
    select * into v_entitlement
    from public.entitlements
    where user_id = p_user_id and planner_id = p_planner_id;
    return v_entitlement;
  end if;

  insert into public.entitlements (user_id, planner_id, status, granted_at, expires_at)
  values (p_user_id, p_planner_id, 'active', now(), p_expires_at)
  on conflict (user_id, planner_id) do update
    set status = 'active',
        granted_at = now(),
        expires_at = excluded.expires_at
  returning * into v_entitlement;

  return v_entitlement;
end;
$$;

/**
 * Revokes a user's entitlement to a planner. Symmetric to
 * `grant_planner_entitlement` in every respect - same idempotency
 * mechanism, same privilege model, same "no-op on a genuine duplicate"
 * behavior. Does not delete the row (an entitlement's history - when it
 * was granted, when it was revoked - stays queryable), only marks it
 * `revoked`; `getActiveEntitlement` (`src/lib/entitlements.ts`) already
 * treats any non-`active` status as no access.
 */
create function public.revoke_planner_entitlement(
  p_user_id uuid,
  p_planner_id uuid,
  p_external_event_id text,
  p_source text
)
returns public.entitlements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted_log_id uuid;
  v_entitlement public.entitlements;
begin
  insert into public.commerce_event_log (source, external_event_id)
  values (p_source, p_external_event_id)
  on conflict (source, external_event_id) do nothing
  returning id into v_inserted_log_id;

  if v_inserted_log_id is null then
    select * into v_entitlement
    from public.entitlements
    where user_id = p_user_id and planner_id = p_planner_id;
    return v_entitlement;
  end if;

  update public.entitlements
  set status = 'revoked'
  where user_id = p_user_id and planner_id = p_planner_id
  returning * into v_entitlement;

  return v_entitlement;
end;
$$;

-- PostgreSQL grants EXECUTE on a newly created function to the `PUBLIC`
-- pseudo-role by default, and Supabase's `anon`/`authenticated` roles
-- inherit from it unless explicitly overridden - so without this, ANY
-- signed-in (or even anonymous) client could call
-- `supabase.rpc("grant_planner_entitlement", {...})` directly from the
-- browser and grant themselves access to anything, `security definer`
-- notwithstanding. This is the actual enforcement of PROMPT 7 Phase 1
-- §5/§8's "safe against arbitrary client invocation" / "no client can
-- create entitlements" - a Postgres-level privilege, not a convention
-- the application layer has to remember to honor.
revoke execute on function public.grant_planner_entitlement(uuid, uuid, text, text, timestamptz) from public, anon, authenticated;
revoke execute on function public.revoke_planner_entitlement(uuid, uuid, text, text) from public, anon, authenticated;

grant execute on function public.grant_planner_entitlement(uuid, uuid, text, text, timestamptz) to service_role;
grant execute on function public.revoke_planner_entitlement(uuid, uuid, text, text) to service_role;
