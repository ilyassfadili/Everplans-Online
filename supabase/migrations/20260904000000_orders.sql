-- Everplans Money Prompt 3: the order/purchase foundation, plus the one
-- `planner_definitions`/`planner_categories` row Budget Planner needs to
-- exist as a valid, known product identity for `public.entitlements` and
-- `public.orders` to reference.
--
-- Why a `planner_definitions` row for a product that deliberately isn't a
-- row in the generic schema-driven planner catalog: `20260823000000_wedding_workspace.sql`
-- and `20260901000000_budget_planner_foundation.sql` both explain that
-- Wedding Planner and Budget Planner are real, hand-built products with
-- their own tables - never instances of the generic `PlannerRuntime` -
-- and `/app/store/page.tsx` is explicit that neither "is, or should
-- become, a row in `planner_definitions`" for DISCOVERY purposes. That
-- reasoning is about the generic catalog/runtime; it says nothing about
-- product IDENTITY for commerce. `public.entitlements` (20260819000002)
-- already keys every access grant off `planner_id references
-- planner_definitions(id)` specifically so a future commerce integration
-- has one universal product-identity table to grant against, regardless
-- of whether the product itself is generic-schema-driven or hand-built -
-- see that migration's own comment ("a future commerce integration
-- inserts rows into this same table after a purchase completes"). This
-- migration is that future integration arriving. The row below is
-- `status = 'draft'`, deliberately never `'published'` - RLS on
-- `planner_definitions` (`20260819000000_planner_definitions.sql`) only
-- ever returns `published` rows to `getPublishedPlannerDefinitions()`/
-- `getPlannerDefinitionBySlug()` (`@/lib/planners.ts`, left completely
-- untouched by this migration), so this row stays invisible to the
-- generic catalog, the Store's own `getPublishedPlannerDefinitions()`
-- read, and `/app/planners` - it exists purely as a stable, known id for
-- `orders.planner_id`/`entitlements.planner_id` to point at, resolved
-- directly by its fixed id below, never by slug lookup through the
-- publish-filtered discovery functions.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status as every migration in this repo. Apply with `supabase db push`
-- or the SQL Editor at https://supabase.com/dashboard.

insert into public.planner_categories (id, slug, name, description)
values (
  '11111111-1111-4111-8111-111111111111',
  'money',
  'Money & Finances',
  'Personal money-planning products.'
)
on conflict (id) do nothing;

insert into public.planner_definitions (id, slug, title, description, category_id, status, schema_version)
values (
  '22222222-2222-4222-8222-222222222222',
  'budget-planner',
  'Budget Planner',
  'A calm, connected budgeting workspace - income, categories, spending, and goals, all in one place.',
  '11111111-1111-4111-8111-111111111111',
  'draft',
  1
)
on conflict (id) do nothing;

-- The Everplans-authoritative order/purchase record. Deliberately distinct
-- from PayPal's own order/payment state (see `src/types/order.ts`'s own
-- top comment) - creating a row here, or even a `provider_order_id` on it,
-- never by itself means a customer paid. Only `@/lib/orders.ts`'s
-- `markOrderPaid` (via the service-role client, the same privilege model
-- `commerce-provisioning.ts` already established) can ever set
-- `status = 'paid'`, and it only does so after a verified server-side
-- check against PayPal's own API.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  planner_id uuid not null references public.planner_definitions (id) on delete restrict,
  product_slug text not null,
  product_name text not null,
  quantity integer not null default 1,
  currency text not null,
  unit_amount_cents integer not null,
  amount_cents integer not null,
  status text not null default 'created',
  payment_provider text not null default 'paypal',
  provider_order_id text,
  provider_capture_id text,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint orders_status_valid check (status in ('created', 'pending', 'paid', 'failed', 'cancelled', 'refunded')),
  constraint orders_quantity_positive check (quantity > 0),
  constraint orders_unit_amount_non_negative check (unit_amount_cents >= 0),
  constraint orders_amount_non_negative check (amount_cents >= 0),
  constraint orders_currency_format check (currency ~ '^[A-Z]{3}$'),
  -- The real duplicate-order-reference guard Prompt 3 Phase 1 asks for -
  -- the same PayPal order/capture id can never be attached to two
  -- different Everplans orders. Nullable columns don't defeat this: Postgres
  -- treats every `null` as distinct for uniqueness purposes, so any number
  -- of not-yet-attached (`created`) orders can coexist, and only an actual
  -- duplicate *value* is ever rejected.
  constraint orders_provider_order_id_unique unique (payment_provider, provider_order_id),
  constraint orders_provider_capture_id_unique unique (payment_provider, provider_capture_id)
);

create index if not exists orders_user_id_idx on public.orders (user_id, created_at desc);
create index if not exists orders_planner_id_idx on public.orders (planner_id);
create index if not exists orders_status_idx on public.orders (status);

alter table public.orders enable row level security;

-- Read-only for the owning user (their own purchase history/receipt) -
-- exactly the same "no insert/update/delete for anon or authenticated at
-- all" shape `public.entitlements` already establishes, for the identical
-- reason: every status transition (`created` -> `pending` -> `paid`/
-- `failed`/`cancelled`/`refunded`) must only ever happen via
-- `@/lib/orders.ts`'s service-role client, never through a signed-in
-- user's own session - otherwise a user could call
-- `supabase.from("orders").update({status:"paid"})` directly against
-- Supabase's REST API with their own session token and forge a purchase,
-- Everplans application code notwithstanding. `service_role` bypasses RLS
-- entirely, so no insert/update policy is needed to let the trusted server
-- code path through - only to keep an ordinary session locked out.
create policy "Users can read their own orders"
  on public.orders
  for select
  to authenticated
  using (user_id = auth.uid());

create function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_orders_updated
  before update on public.orders
  for each row execute function public.set_orders_updated_at();
