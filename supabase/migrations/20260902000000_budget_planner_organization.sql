-- Budget Planner: category context notes (Prompt 5 Phase 2). A small,
-- optional free-text field so a user can record *why* they set a category
-- up a certain way ("cut this back after the trip"), the same lightweight
-- role `notes` already plays on `budget_income_sources` and
-- `budget_recurring_items` - never a separate notes table, never required.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status every migration in this repo starts in. Apply with
-- `supabase db push` or the SQL Editor at https://supabase.com/dashboard.

alter table public.budget_categories
  add column if not exists notes text;
