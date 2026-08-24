-- Wedding Planner: the canonical vendor record (Prompt 4 Phases 3-4) -
-- extends `public.wedding_vendors` (`20260826000000_wedding_budget.sql`)
-- in place rather than creating a second vendor table. Every expense that
-- already references a vendor by id keeps working unchanged: nothing here
-- touches `wedding_expenses` or the existing name/uniqueness behavior,
-- only adds columns that default to a sensible empty state.
--
-- No separate "payments" table: an expense already represents actual
-- spending (`wedding_expenses`, Prompt 3), and a vendor's real spending is
-- `sum(expenses where vendor_id = this vendor)` - computed at read time
-- (`@/lib/wedding/vendor-budget.ts`), the same "derive, don't duplicate"
-- principle the budget/category totals already follow. `planned_amount_cents`
-- below is the one genuinely new number (an optional target - "we expect
-- to spend about $3,000 with this vendor"), not a duplicate of anything
-- an expense already tracks.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status every migration in this repo starts in. Apply with
-- `supabase db push` or the SQL Editor at https://supabase.com/dashboard.

alter table public.wedding_vendors
  add column if not exists category text,
  add column if not exists contact_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists notes text,
  add column if not exists planned_amount_cents integer,
  -- Booking-pipeline status (Phase 3: "keep status understandable... not a
  -- complex CRM pipeline") - existing rows (created before this column
  -- existed, back when a vendor was just a name) default to 'prospect',
  -- the honest starting point for a vendor nobody has evaluated yet.
  add column if not exists status text not null default 'prospect';

alter table public.wedding_vendors
  add constraint wedding_vendors_status_valid check (status in ('prospect', 'considering', 'booked', 'not-proceeding'));

alter table public.wedding_vendors
  add constraint wedding_vendors_planned_amount_non_negative check (planned_amount_cents is null or planned_amount_cents >= 0);

alter table public.wedding_vendors
  add constraint wedding_vendors_category_length check (category is null or char_length(category) <= 100);

alter table public.wedding_vendors
  add constraint wedding_vendors_notes_length check (notes is null or char_length(notes) <= 1000);
