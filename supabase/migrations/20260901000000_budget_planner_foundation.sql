-- Budget Planner: the complete foundation schema (Prompt 1 Phase 1) - one
-- migration for the whole domain because every table below is part of one
-- continuous, tightly-coupled feature designed together up front, the same
-- reasoning `20260826000000_wedding_budget.sql` gives for combining
-- categories/vendors/expenses in one pass. Building the relational shape now
-- (even though most of it has no UI yet - see each table's own comment for
-- which roadmap prompt fills it in) avoids the churn of bolting foreign keys
-- onto already-live tables later.
--
-- Deliberately its own set of tables, not rows in `planner_definitions`/
-- instances in `planner_instances` - same reasoning as
-- `20260823000000_wedding_workspace.sql`'s own comment: those tables are the
-- generic, content-agnostic downloadable-planner marketplace (a flat
-- field-answer wizard); the Budget Planner is a real, purpose-built product
-- with its own relational shape (income sources, categories, goals, and the
-- relationships between them) that model cannot represent. It shares only
-- the genuinely generic layers: auth, the Supabase clients, the `(app)`
-- shell, and the design system.
--
-- All monetary amounts are integer minor units (cents), never floating
-- point - the same convention `wedding_budget_categories`/`wedding_expenses`
-- already establish, reused here rather than reinvented.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status every migration in this repo starts in. Apply with
-- `supabase db push` or the SQL Editor at https://supabase.com/dashboard.

-- The workspace itself - one row per account, the root every other Budget
-- Planner table hangs off via `plan_id`. `period_type` is the one setting
-- that determines how income/recurring amounts of a different cadence
-- ("$500/week") translate into "per period" figures the dashboard can add
-- up against a monthly or weekly plan without duplicating that logic
-- per-caller (`@/lib/budget/period.ts`).
create table if not exists public.budget_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'My Budget',
  currency text not null default 'USD',
  period_type text not null default 'monthly',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One workspace per account, same guard `weddings_owner_unique` provides -
  -- the database-level backstop behind onboarding's check-before-insert.
  constraint budget_plans_owner_unique unique (owner_id),
  constraint budget_plans_name_length check (char_length(name) between 1 and 100),
  constraint budget_plans_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint budget_plans_period_type_valid check (period_type in ('weekly', 'biweekly', 'monthly', 'yearly'))
);

create index if not exists budget_plans_owner_id_idx on public.budget_plans (owner_id);

alter table public.budget_plans enable row level security;

create policy "Users can read their own budget plan"
  on public.budget_plans
  for select
  to authenticated
  using (owner_id = auth.uid());

create policy "Users can create their own budget plan"
  on public.budget_plans
  for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Users can update their own budget plan"
  on public.budget_plans
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create function public.set_budget_plans_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_budget_plans_updated
  before update on public.budget_plans
  for each row execute function public.set_budget_plans_updated_at();

-- Income sources - what the budget is based on (Prompt 2 Phase 2 builds the
-- full management UI; Phase 4 of this prompt only reads/creates the basics).
-- Not hard-coded types - `name` is free text, so "Salary," "Freelance,"
-- "Allowance" are just what a user typed, never a fixed enum.
create table if not exists public.budget_income_sources (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.budget_plans (id) on delete cascade,
  name text not null,
  amount_cents integer not null default 0,
  frequency text not null default 'monthly',
  is_active boolean not null default true,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint budget_income_sources_name_length check (char_length(name) between 1 and 100),
  constraint budget_income_sources_amount_non_negative check (amount_cents >= 0),
  constraint budget_income_sources_frequency_valid check (frequency in ('weekly', 'biweekly', 'monthly', 'yearly', 'one-time'))
);

create index if not exists budget_income_sources_plan_id_idx
  on public.budget_income_sources (plan_id, sort_order);

alter table public.budget_income_sources enable row level security;

create policy "Users can manage their own budget income sources"
  on public.budget_income_sources
  for all
  to authenticated
  using (exists (select 1 from public.budget_plans p where p.id = budget_income_sources.plan_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.budget_plans p where p.id = budget_income_sources.plan_id and p.owner_id = auth.uid()));

create function public.set_budget_income_sources_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_budget_income_sources_updated
  before update on public.budget_income_sources
  for each row execute function public.set_budget_income_sources_updated_at();

-- Expense categories - the planning side ("what do I expect to spend").
-- `group_label` is a small closed set of broad groupings (Prompt 5 Phase 1
-- builds real reordering/archiving UI around it); `is_archived` exists from
-- day one so a future "archive, don't delete" flow never needs a schema
-- change to avoid orphaning expenses/recurring items that reference it.
create table if not exists public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.budget_plans (id) on delete cascade,
  name text not null,
  group_label text not null default 'other',
  planned_amount_cents integer not null default 0,
  is_archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint budget_categories_name_length check (char_length(name) between 1 and 100),
  constraint budget_categories_planned_amount_non_negative check (planned_amount_cents >= 0),
  constraint budget_categories_group_label_valid check (group_label in ('essentials', 'lifestyle', 'savings', 'goals', 'other'))
);

create index if not exists budget_categories_plan_id_idx
  on public.budget_categories (plan_id, sort_order);

alter table public.budget_categories enable row level security;

create policy "Users can manage their own budget categories"
  on public.budget_categories
  for all
  to authenticated
  using (exists (select 1 from public.budget_plans p where p.id = budget_categories.plan_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.budget_plans p where p.id = budget_categories.plan_id and p.owner_id = auth.uid()));

create function public.set_budget_categories_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_budget_categories_updated
  before update on public.budget_categories
  for each row execute function public.set_budget_categories_updated_at();

-- Financial goals - target/progress, independent of any one category (a
-- goal like "Emergency fund" isn't spending in a category, it's money set
-- aside). Prompt 3 Phase 3 builds the full goals experience; this is the
-- relational shape it will read and write.
create table if not exists public.budget_goals (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.budget_plans (id) on delete cascade,
  name text not null,
  target_amount_cents integer not null,
  current_amount_cents integer not null default 0,
  target_date date,
  description text,
  status text not null default 'not-started',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint budget_goals_name_length check (char_length(name) between 1 and 100),
  constraint budget_goals_target_amount_non_negative check (target_amount_cents >= 0),
  constraint budget_goals_current_amount_non_negative check (current_amount_cents >= 0),
  constraint budget_goals_status_valid check (status in ('not-started', 'in-progress', 'completed'))
);

create index if not exists budget_goals_plan_id_idx on public.budget_goals (plan_id, sort_order);

alter table public.budget_goals enable row level security;

create policy "Users can manage their own budget goals"
  on public.budget_goals
  for all
  to authenticated
  using (exists (select 1 from public.budget_plans p where p.id = budget_goals.plan_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.budget_plans p where p.id = budget_goals.plan_id and p.owner_id = auth.uid()));

create function public.set_budget_goals_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_budget_goals_updated
  before update on public.budget_goals
  for each row execute function public.set_budget_goals_updated_at();

-- Actual expenses - what was really spent. `category_id` is `on delete set
-- null`, same as `wedding_expenses.category_id`: removing a category must
-- never delete someone's spending history, only unlink it back to
-- "uncategorized". `recurring_item_id` (added below, after
-- `budget_recurring_items` exists) links an actual expense back to the
-- recurring definition that generated it, once Prompt 4 starts creating
-- those - never required, since most expenses are one-off.
create table if not exists public.budget_expenses (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.budget_plans (id) on delete cascade,
  category_id uuid references public.budget_categories (id) on delete set null,
  title text not null,
  amount_cents integer not null,
  expense_date date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint budget_expenses_title_length check (char_length(title) between 1 and 150),
  constraint budget_expenses_amount_non_negative check (amount_cents >= 0)
);

create index if not exists budget_expenses_plan_id_idx on public.budget_expenses (plan_id, expense_date desc);
create index if not exists budget_expenses_category_id_idx on public.budget_expenses (category_id);

alter table public.budget_expenses enable row level security;

create policy "Users can manage their own budget expenses"
  on public.budget_expenses
  for all
  to authenticated
  using (exists (select 1 from public.budget_plans p where p.id = budget_expenses.plan_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.budget_plans p where p.id = budget_expenses.plan_id and p.owner_id = auth.uid()));

create function public.set_budget_expenses_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_budget_expenses_updated
  before update on public.budget_expenses
  for each row execute function public.set_budget_expenses_updated_at();

-- Recurring financial items - a *definition* of something that repeats
-- (income, an expense/bill, or a savings contribution), deliberately
-- separate from any actual occurrence: a monthly rent recurrence is not
-- itself a `budget_expenses` row, so a future month's rent never appears as
-- money already spent. Prompt 4 Phase 1 builds the full management UI and
-- next-occurrence calculation; this is the foundation table it operates on.
create table if not exists public.budget_recurring_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.budget_plans (id) on delete cascade,
  type text not null,
  name text not null,
  amount_cents integer not null,
  category_id uuid references public.budget_categories (id) on delete set null,
  frequency text not null default 'monthly',
  start_date date not null,
  end_date date,
  next_occurrence_date date,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint budget_recurring_items_name_length check (char_length(name) between 1 and 150),
  constraint budget_recurring_items_amount_non_negative check (amount_cents >= 0),
  constraint budget_recurring_items_type_valid check (type in ('income', 'expense', 'savings')),
  constraint budget_recurring_items_frequency_valid check (frequency in ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'))
);

create index if not exists budget_recurring_items_plan_id_idx on public.budget_recurring_items (plan_id, next_occurrence_date);

alter table public.budget_recurring_items enable row level security;

create policy "Users can manage their own budget recurring items"
  on public.budget_recurring_items
  for all
  to authenticated
  using (exists (select 1 from public.budget_plans p where p.id = budget_recurring_items.plan_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.budget_plans p where p.id = budget_recurring_items.plan_id and p.owner_id = auth.uid()));

create function public.set_budget_recurring_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_budget_recurring_items_updated
  before update on public.budget_recurring_items
  for each row execute function public.set_budget_recurring_items_updated_at();

-- An actual expense generated from a recurring definition, once Prompt 4
-- starts creating those rows automatically - `on delete set null` so
-- deleting the recurring definition later never deletes the historical
-- expenses it already produced.
alter table public.budget_expenses
  add column if not exists recurring_item_id uuid references public.budget_recurring_items (id) on delete set null;

create index if not exists budget_expenses_recurring_item_id_idx on public.budget_expenses (recurring_item_id);

-- Savings targets - a planned, recurring contribution toward a goal (or
-- general savings when `goal_id` is null). Deliberately its own table
-- rather than overloading `budget_goals` (a goal is "what," a savings
-- target is "how much, how often") or `budget_recurring_items` (a savings
-- target is a plan to allocate money, not itself a transaction type a
-- category could apply to). Prompt 3 Phase 4 builds the real savings
-- planning experience on top of this.
create table if not exists public.budget_savings_targets (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.budget_plans (id) on delete cascade,
  goal_id uuid references public.budget_goals (id) on delete set null,
  name text not null,
  planned_amount_cents integer not null default 0,
  frequency text not null default 'monthly',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint budget_savings_targets_name_length check (char_length(name) between 1 and 100),
  constraint budget_savings_targets_amount_non_negative check (planned_amount_cents >= 0),
  constraint budget_savings_targets_frequency_valid check (frequency in ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'))
);

create index if not exists budget_savings_targets_plan_id_idx on public.budget_savings_targets (plan_id);
create index if not exists budget_savings_targets_goal_id_idx on public.budget_savings_targets (goal_id);

alter table public.budget_savings_targets enable row level security;

create policy "Users can manage their own budget savings targets"
  on public.budget_savings_targets
  for all
  to authenticated
  using (exists (select 1 from public.budget_plans p where p.id = budget_savings_targets.plan_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.budget_plans p where p.id = budget_savings_targets.plan_id and p.owner_id = auth.uid()));

create function public.set_budget_savings_targets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_budget_savings_targets_updated
  before update on public.budget_savings_targets
  for each row execute function public.set_budget_savings_targets_updated_at();
