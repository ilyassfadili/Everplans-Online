-- Travel Planner (Product #3) - expense tracking (Prompt 3 Phase 2).
--
-- `public.trip_expenses` is a child of `trips`, same shape as
-- `wedding_expenses`: `category_id` is a real, optional foreign key
-- (`on delete set null`, the same "removing a category shouldn't destroy
-- the expenses that used to be grouped under it" rule
-- `wedding_expenses.category_id` already establishes) - an expense's
-- category is never duplicated onto the row as a name, only referenced.
create table if not exists public.trip_expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  category_id uuid references public.trip_budget_categories (id) on delete set null,
  title text not null,
  amount_cents integer not null,
  expense_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trip_expenses_title_length check (char_length(title) between 1 and 150),
  constraint trip_expenses_amount_non_negative check (amount_cents >= 0),
  constraint trip_expenses_notes_length check (notes is null or char_length(notes) <= 500)
);

create index if not exists trip_expenses_trip_id_idx on public.trip_expenses (trip_id, expense_date desc);
create index if not exists trip_expenses_category_id_idx on public.trip_expenses (category_id);

alter table public.trip_expenses enable row level security;

create policy "Users can manage their own trip expenses" on public.trip_expenses
  for all to authenticated
  using (exists (select 1 from public.trips t where t.id = trip_expenses.trip_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_expenses.trip_id and t.owner_id = auth.uid()));

create function public.set_trip_expenses_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_trip_expenses_updated
  before update on public.trip_expenses
  for each row
  execute function public.set_trip_expenses_updated_at();
