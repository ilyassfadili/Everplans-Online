-- Budget Planner: accounts + an actual income ledger (Everplans Money
-- Prompt 1/2 gap-fill).
--
-- Two real gaps found by auditing the existing Budget Planner against the
-- Everplans Money roadmap (which this same product already implements under
-- its real, customer-facing name - see `src/config/products/budget-planner.ts`):
--
-- 1. No "account" concept existed anywhere (checking/savings/cash/credit
--    card) - every dollar was unattached to a source of funds. This
--    migration adds `budget_accounts`, plus an optional `account_id` on
--    `budget_expenses` and `budget_recurring_items` (income entries get
--    theirs at creation, below).
-- 2. `budget_income_sources` is a *recurring definition* ("Salary,
--    $3,000/monthly"), never an actual, dated event - the same distinction
--    `budget_recurring_items` already draws for expenses ("a definition of
--    something that repeats, deliberately separate from any actual
--    occurrence"). There was therefore no way to log "I was actually paid
--    $1,500 on August 15th," which a real Income page, a unified
--    Transactions view, and a month-scoped Overview all need. This adds
--    `budget_income_entries` - the income-side counterpart to
--    `budget_expenses` - without touching what `budget_income_sources`
--    already means or how the existing Budget page's "expected income"
--    math (`@/lib/budget/period.ts`) reads it.
--
-- `budget_categories` also gains `kind` (`income` | `expense`), defaulting
-- every existing/new row to `expense` - categories were expense-only in
-- practice already (only `budget_expenses`/`budget_recurring_items`
-- reference one), so this is purely additive: nothing that exists today
-- changes meaning.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status as every migration in this repo. Apply with `supabase db push` or
-- the SQL Editor at https://supabase.com/dashboard.

-- Financial accounts - a manual, non-synced organizational concept only
-- ("this expense came out of my checking account"), never a bank
-- integration. `type` is a small closed set; `name` is free text ("Chase
-- Checking," "Emergency Fund") the same way `budget_income_sources.name` is.
create table if not exists public.budget_accounts (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.budget_plans (id) on delete cascade,
  name text not null,
  type text not null default 'checking',
  is_archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint budget_accounts_name_length check (char_length(name) between 1 and 100),
  constraint budget_accounts_type_valid check (type in ('checking', 'savings', 'cash', 'credit-card', 'other'))
);

create index if not exists budget_accounts_plan_id_idx on public.budget_accounts (plan_id, sort_order);

alter table public.budget_accounts enable row level security;

create policy "Users can manage their own budget accounts"
  on public.budget_accounts
  for all
  to authenticated
  using (exists (select 1 from public.budget_plans p where p.id = budget_accounts.plan_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.budget_plans p where p.id = budget_accounts.plan_id and p.owner_id = auth.uid()));

create function public.set_budget_accounts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_budget_accounts_updated
  before update on public.budget_accounts
  for each row execute function public.set_budget_accounts_updated_at();

-- Categories: an income/expense distinction. Not a new table - a category's
-- planned-amount/group/archive behavior (Budget page) is unchanged; this
-- only lets a category picker tell "for income" and "for expense" categories
-- apart, the same way `budget_expenses`/`budget_recurring_items` already
-- distinguish transaction types.
alter table public.budget_categories
  add column if not exists kind text not null default 'expense';

alter table public.budget_categories
  add constraint budget_categories_kind_valid check (kind in ('income', 'expense'));

-- Expenses/recurring items: an optional account reference - "which account
-- did this come out of," never required (most users won't bother tracking
-- this at first, same optionality `category_id` already has).
alter table public.budget_expenses
  add column if not exists account_id uuid references public.budget_accounts (id) on delete set null;

create index if not exists budget_expenses_account_id_idx on public.budget_expenses (account_id);

alter table public.budget_recurring_items
  add column if not exists account_id uuid references public.budget_accounts (id) on delete set null;

create index if not exists budget_recurring_items_account_id_idx on public.budget_recurring_items (account_id);

-- Actual income received - the income-side counterpart to `budget_expenses`.
-- `source_id` is an optional link back to the recurring definition this
-- payment came from (`budget_income_sources`) - `on delete set null`, same
-- reasoning `budget_expenses.recurring_item_id` already applies: removing a
-- recurring income source must never delete the income history it already
-- produced, only unlink it.
create table if not exists public.budget_income_entries (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.budget_plans (id) on delete cascade,
  source_id uuid references public.budget_income_sources (id) on delete set null,
  category_id uuid references public.budget_categories (id) on delete set null,
  account_id uuid references public.budget_accounts (id) on delete set null,
  title text not null,
  amount_cents integer not null,
  entry_date date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint budget_income_entries_title_length check (char_length(title) between 1 and 150),
  constraint budget_income_entries_amount_non_negative check (amount_cents >= 0)
);

create index if not exists budget_income_entries_plan_id_idx on public.budget_income_entries (plan_id, entry_date desc);
create index if not exists budget_income_entries_category_id_idx on public.budget_income_entries (category_id);
create index if not exists budget_income_entries_account_id_idx on public.budget_income_entries (account_id);

alter table public.budget_income_entries enable row level security;

create policy "Users can manage their own budget income entries"
  on public.budget_income_entries
  for all
  to authenticated
  using (exists (select 1 from public.budget_plans p where p.id = budget_income_entries.plan_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.budget_plans p where p.id = budget_income_entries.plan_id and p.owner_id = auth.uid()));

create function public.set_budget_income_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_budget_income_entries_updated
  before update on public.budget_income_entries
  for each row execute function public.set_budget_income_entries_updated_at();
