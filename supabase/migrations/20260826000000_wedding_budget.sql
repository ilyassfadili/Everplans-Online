-- Wedding Planner: budget, expenses, and the minimum vendor identity
-- financial tracking needs (Prompt 3 Phases 2-4). One migration for all
-- three because they're one continuous, tightly-coupled feature built in
-- one pass - the same reasoning `20260824000000_wedding_planning_core.sql`
-- gives for combining milestones and tasks, applied here to categories,
-- vendors, and expenses (expenses reference both from the start, rather
-- than a churny second migration adding `vendor_id` later).
--
-- All monetary amounts are integer minor units (cents), never floating
-- point - `numeric`/`float` both invite silent rounding drift over many
-- additions; integer cents don't.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status every migration in this repo starts in. Apply with
-- `supabase db push` or the SQL Editor at https://supabase.com/dashboard.

-- A simple workspace-level currency (Phase 2: "not a complex multi-currency
-- system") - one column on the wedding itself, read consistently by every
-- budget/expense display (`@/lib/wedding/currency.ts`). No conversion, no
-- per-category override.
alter table public.weddings
  add column if not exists currency text not null default 'USD';

alter table public.weddings
  add constraint weddings_currency_format check (currency ~ '^[A-Z]{3}$');

-- Budget categories - "Total planned budget" (Phase 2) is deliberately NOT
-- a separate stored number anywhere: it's `sum(planned_amount_cents)`,
-- computed at read time (`@/lib/wedding/budget.ts`), so there's exactly
-- one place a couple sets planning targets.
create table if not exists public.wedding_budget_categories (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  description text,
  planned_amount_cents integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint wedding_budget_categories_name_length check (char_length(name) between 1 and 100),
  constraint wedding_budget_categories_planned_amount_non_negative check (planned_amount_cents >= 0)
);

create index if not exists wedding_budget_categories_wedding_id_idx
  on public.wedding_budget_categories (wedding_id, sort_order);

alter table public.wedding_budget_categories enable row level security;

create policy "Users can manage their own wedding budget categories"
  on public.wedding_budget_categories
  for all
  to authenticated
  using (
    exists (select 1 from public.weddings w where w.id = wedding_budget_categories.wedding_id and w.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.weddings w where w.id = wedding_budget_categories.wedding_id and w.owner_id = auth.uid())
  );

create function public.set_wedding_budget_categories_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_wedding_budget_categories_updated
  before update on public.wedding_budget_categories
  for each row execute function public.set_wedding_budget_categories_updated_at();

-- The minimum vendor identity Phase 4 asks for - a name, and nothing
-- else. Full vendor profiles/contacts/discovery are Prompt 4's own
-- product; this exists only so an expense can reference *who* it went to
-- without repeating that name as free text on every row. Case-insensitive
-- uniqueness per wedding is what makes "find or create by name"
-- (`@/lib/wedding/vendors.ts`) safe to call from an expense form without
-- accumulating "Photographer" and "photographer" as two separate rows.
create table if not exists public.wedding_vendors (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint wedding_vendors_name_length check (char_length(name) between 1 and 150)
);

create unique index if not exists wedding_vendors_wedding_id_name_key
  on public.wedding_vendors (wedding_id, lower(name));

alter table public.wedding_vendors enable row level security;

create policy "Users can manage their own wedding vendors"
  on public.wedding_vendors
  for all
  to authenticated
  using (
    exists (select 1 from public.weddings w where w.id = wedding_vendors.wedding_id and w.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.weddings w where w.id = wedding_vendors.wedding_id and w.owner_id = auth.uid())
  );

create function public.set_wedding_vendors_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_wedding_vendors_updated
  before update on public.wedding_vendors
  for each row execute function public.set_wedding_vendors_updated_at();

-- Expenses - actual spending. `category_id`/`vendor_id` are both
-- nullable references, deliberately `on delete set null` rather than
-- `cascade`: deleting a budget category or a vendor should never delete
-- someone's spending history, only unlink it back to "uncategorized" /
-- "no vendor". This is also exactly the "existing expenses must keep
-- working when no vendor is associated" guarantee Phase 4 asks for -
-- `vendor_id` is optional from day one, not backfilled later.
create table if not exists public.wedding_expenses (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  category_id uuid references public.wedding_budget_categories (id) on delete set null,
  vendor_id uuid references public.wedding_vendors (id) on delete set null,
  title text not null,
  amount_cents integer not null,
  expense_date date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint wedding_expenses_title_length check (char_length(title) between 1 and 150),
  constraint wedding_expenses_amount_non_negative check (amount_cents >= 0)
);

create index if not exists wedding_expenses_wedding_id_idx on public.wedding_expenses (wedding_id, expense_date desc);
create index if not exists wedding_expenses_category_id_idx on public.wedding_expenses (category_id);
create index if not exists wedding_expenses_vendor_id_idx on public.wedding_expenses (vendor_id);

alter table public.wedding_expenses enable row level security;

create policy "Users can manage their own wedding expenses"
  on public.wedding_expenses
  for all
  to authenticated
  using (
    exists (select 1 from public.weddings w where w.id = wedding_expenses.wedding_id and w.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.weddings w where w.id = wedding_expenses.wedding_id and w.owner_id = auth.uid())
  );

create function public.set_wedding_expenses_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_wedding_expenses_updated
  before update on public.wedding_expenses
  for each row execute function public.set_wedding_expenses_updated_at();
