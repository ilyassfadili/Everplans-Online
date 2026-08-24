-- Everplans Money Prompt 4 (entitlement provenance/product access) + Prompt 5
-- (purchase history + refund foundation) schema changes. One migration
-- because every column here serves the same underlying relationship -
-- "which order granted/revoked this entitlement, and can a refund of that
-- order be represented without losing history" - the same reasoning
-- `20260901000000_budget_planner_foundation.sql`'s own header gives for
-- combining a tightly-coupled domain's tables in one pass.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status as every migration in this repo. Apply with `supabase db push` or
-- the SQL Editor at https://supabase.com/dashboard.

-- `entitlements` gains: `order_id` (which verified order granted this - the
-- "User -> Order -> Entitlement" provenance link Prompt 4 Phase 1 asks
-- for), `revoked_at` (when, independent of `status` alone), and `metadata`
-- (small, non-sensitive audit context - e.g. `{"reason":"refund"}` - never
-- payment secrets, never a PayPal token). `order_id` is nullable and
-- `on delete set null`: a future non-purchase grant (a comp, an admin
-- override) is still a legitimate entitlement with no order behind it, and
-- an entitlement must never disappear just because the order that
-- originally granted it does.
alter table public.entitlements
  add column if not exists order_id uuid references public.orders (id) on delete set null,
  add column if not exists revoked_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists entitlements_order_id_idx on public.entitlements (order_id);

-- `orders` gains the refund foundation Prompt 5 Phase 3 asks for -
-- `refunded_at` and PayPal's own refund id, the same "provider reference,
-- Everplans timestamp" shape `provider_capture_id`/`paid_at` already
-- established for the payment side. `status = 'refunded'` already existed
-- (`20260904000000_orders.sql`'s own `orders_status_valid` check) - this is
-- the detail those transitions were always meant to carry, not a new
-- concept.
alter table public.orders
  add column if not exists refunded_at timestamptz,
  add column if not exists provider_refund_id text;

alter table public.orders
  add constraint orders_provider_refund_id_unique unique (payment_provider, provider_refund_id);

-- Both RPC functions gain two new, defaulted parameters. PostgreSQL
-- identifies a function by name *and input parameter types* - appending
-- parameters (even defaulted ones) changes that identity, so
-- `create or replace function` alone would create a second, overloaded
-- function sitting alongside the original 5-/4-arg versions rather than
-- truly replacing them. The explicit drops below remove those original
-- signatures first, so exactly one version of each function exists after
-- this migration runs - the same "no dangling old code path" outcome
-- `create or replace` implies but doesn't actually guarantee once the
-- parameter list itself changes.
drop function if exists public.grant_planner_entitlement(uuid, uuid, text, text, timestamptz);
drop function if exists public.revoke_planner_entitlement(uuid, uuid, text, text);

create or replace function public.grant_planner_entitlement(
  p_user_id uuid,
  p_planner_id uuid,
  p_external_event_id text,
  p_source text,
  p_expires_at timestamptz default null,
  p_order_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
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

  insert into public.entitlements (user_id, planner_id, status, granted_at, expires_at, order_id, metadata)
  values (p_user_id, p_planner_id, 'active', now(), p_expires_at, p_order_id, p_metadata)
  on conflict (user_id, planner_id) do update
    set status = 'active',
        granted_at = now(),
        expires_at = excluded.expires_at,
        order_id = excluded.order_id,
        metadata = excluded.metadata,
        -- Re-granting (e.g. a corrected re-purchase after a prior revoke)
        -- clears any earlier revocation timestamp - the row is active
        -- again, in full, not "active but still marked as once-revoked."
        revoked_at = null
  returning * into v_entitlement;

  return v_entitlement;
end;
$$;

create or replace function public.revoke_planner_entitlement(
  p_user_id uuid,
  p_planner_id uuid,
  p_external_event_id text,
  p_source text,
  p_metadata jsonb default '{}'::jsonb
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
  set status = 'revoked',
      revoked_at = now(),
      metadata = p_metadata
  where user_id = p_user_id and planner_id = p_planner_id
  returning * into v_entitlement;

  return v_entitlement;
end;
$$;

revoke execute on function public.grant_planner_entitlement(uuid, uuid, text, text, timestamptz, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.revoke_planner_entitlement(uuid, uuid, text, text, jsonb) from public, anon, authenticated;

grant execute on function public.grant_planner_entitlement(uuid, uuid, text, text, timestamptz, uuid, jsonb) to service_role;
grant execute on function public.revoke_planner_entitlement(uuid, uuid, text, text, jsonb) to service_role;
