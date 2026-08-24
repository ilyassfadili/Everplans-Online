-- Everplans Money Prompt 7: the internal commerce-operations foundation -
-- who is allowed to see commerce data across every customer (never just
-- their own, unlike every other table in this schema), a real record of
-- webhook processing outcomes for operational visibility, and an audit
-- trail for the one operational action this prompt allows (a safe,
-- idempotent payment-verification retry).
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status as every migration in this repo. Apply with `supabase db push` or
-- the SQL Editor at https://supabase.com/dashboard.

-- Who is a commerce operator. Deliberately its own table, not a `role`
-- column on `profiles` - `profiles` already has a broad "users can update
-- their own profile" policy (`20260819000001_profiles.sql`), and a role
-- column living on a self-editable row is exactly the kind of privilege
-- escalation path Prompt 7 explicitly warns against ("do not trust
-- frontend role information," "a normal customer must not be able to
-- access commerce administration functionality by... changing a role
-- value in the browser"). A separate table with RLS enabled and ZERO
-- policies for `anon`/`authenticated` (the same "structurally impossible
-- through the publishable-key clients, not merely unlisted" shape
-- `commerce_event_log` already established) means there is no row a user
-- could ever read OR write about their own operator status through an
-- ordinary session - only the service-role client
-- (`@/lib/supabase/service.ts`) can ever query this table, which is
-- exactly the trust boundary the authorization check needs.
--
-- No seed data, no in-app management UI - the same "no admin CMS in the
-- application itself" pattern `planner_definitions`/`entitlements` already
-- follow. Grant operator access via the Supabase dashboard's table editor:
-- `insert into public.commerce_operators (user_id) values ('<their auth.users.id>');`
create table if not exists public.commerce_operators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted_at timestamptz not null default now(),
  notes text
);

alter table public.commerce_operators enable row level security;

-- A real record of PayPal webhook processing (Everplans Money Prompt 7
-- Phase 2's "which event was received, when, whether processed, succeeded
-- or failed, which order it related to"), distinct from
-- `commerce_event_log` (`20260819000003_commerce_provisioning.sql`), which
-- stays exactly as it is - a pure idempotency ledger the grant/revoke RPCs
-- write to internally, with no notion of "did this API call succeed" or
-- "which order." This table is written directly by the webhook Route
-- Handler (`/api/webhooks/paypal`) itself, after signature verification
-- succeeds (an unverified/rejected request is never logged here - see
-- that route's own comment - only real PayPal-signed deliveries), and is
-- purely for operator visibility - nothing in the actual payment/
-- entitlement logic reads from it.
create table if not exists public.commerce_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'paypal',
  provider_event_id text not null,
  event_type text not null,
  order_id uuid references public.orders (id) on delete set null,
  status text not null default 'received',
  -- A short, safe operator-facing message - never a raw provider payload
  -- or a stack trace (Prompt 7's own "do not expose unnecessary raw
  -- provider payloads").
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,

  constraint commerce_webhook_events_status_valid check (status in ('received', 'processed', 'ignored', 'failed')),
  constraint commerce_webhook_events_provider_event_unique unique (provider, provider_event_id)
);

create index if not exists commerce_webhook_events_order_id_idx on public.commerce_webhook_events (order_id);
create index if not exists commerce_webhook_events_received_at_idx on public.commerce_webhook_events (received_at desc);

alter table public.commerce_webhook_events enable row level security;

-- The commerce-ops audit trail (Prompt 7 Phase 4) - every operational
-- action an authorized operator takes, so it's traceable after the fact.
-- Deliberately minimal (operator, action, target, result, timestamp, small
-- safe metadata) - not a general event-sourcing/audit framework, just
-- enough to answer "who did what, to which order, and what happened."
-- Never stores secrets or raw provider payloads in `metadata`.
create table if not exists public.commerce_ops_audit_log (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references auth.users (id) on delete restrict,
  action text not null,
  target_type text not null,
  target_id text not null,
  result text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists commerce_ops_audit_log_target_idx on public.commerce_ops_audit_log (target_type, target_id);
create index if not exists commerce_ops_audit_log_operator_id_idx on public.commerce_ops_audit_log (operator_id);

alter table public.commerce_ops_audit_log enable row level security;

-- No policies on any of the three tables above for `anon`/`authenticated` -
-- deliberate, matching `commerce_event_log`'s own shape exactly. Every read
-- and write happens exclusively through `createSupabaseServiceClient()`
-- (`@/lib/supabase/service.ts`) from code that has already verified the
-- caller is a real commerce operator (`@/lib/commerce-ops/auth.ts`) -
-- structurally impossible for an ordinary session to reach, not merely
-- unlisted by the current UI.
