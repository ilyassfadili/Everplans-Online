-- Generic planner product-definition schema.
--
-- This is PRODUCT DEFINITION data - what a planner *is* - never customer
-- data. A customer's actual plan-in-progress (their answers, their
-- selections, their saved state while using a planner) has no table here
-- and is explicitly out of scope for this migration; see PROMPT 3's
-- "Separate product definition from customer data" for why that line is
-- deliberate. When that customer-data work happens, it belongs in its own
-- migration, with its own row-level ownership tied to auth.uid() - a
-- fundamentally different access shape from the read-mostly, "same row
-- for every viewer" data below.
--
-- No seed data. Both tables are created genuinely empty - zero rows,
-- zero planner products - matching PROMPT 3's non-negotiable scope
-- boundary. Nothing here should ever be treated as evidence a real
-- planner exists.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status as supabase/migrations/20260818000000_contact_submissions.sql.
-- Apply with the Supabase CLI (`supabase db push`) or the SQL Editor at
-- https://supabase.com/dashboard.

create table if not exists public.planner_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint planner_categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint planner_categories_slug_length check (char_length(slug) between 1 and 100),
  constraint planner_categories_name_length check (char_length(name) between 1 and 200)
);

create table if not exists public.planner_definitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  category_id uuid not null references public.planner_categories (id) on delete restrict,
  status text not null default 'draft',
  -- The minimum versioning foundation PROMPT 3 asks for: an integer a
  -- future runtime can compare against to know which structural version
  -- of this planner a piece of customer data was created under. Not a
  -- changelog or revision history - see the PlannerDefinition TypeScript
  -- type (src/types/planner-definition.ts) for the full reasoning.
  schema_version integer not null default 1,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint planner_definitions_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint planner_definitions_slug_length check (char_length(slug) between 1 and 100),
  constraint planner_definitions_title_length check (char_length(title) between 1 and 200),
  constraint planner_definitions_status_valid check (status in ('draft', 'published', 'archived')),
  constraint planner_definitions_schema_version_positive check (schema_version >= 1)
);

create index if not exists planner_definitions_category_id_idx on public.planner_definitions (category_id);
create index if not exists planner_definitions_status_idx on public.planner_definitions (status);

alter table public.planner_categories enable row level security;
alter table public.planner_definitions enable row level security;

-- Product definitions are not secret - the same information a future
-- catalog page shows any visitor. Read-only for every caller (anon
-- browsing the future public catalog, authenticated users browsing the
-- in-app discovery surface): no insert/update/delete policy exists for
-- either role, so nothing outside the Supabase dashboard (service_role,
-- which bypasses RLS) can create, edit, or remove a planner or category -
-- there is deliberately no CRUD/admin surface in the application itself
-- yet, matching PROMPT 3's "do not build an admin CMS."
create policy "Anyone can read planner categories"
  on public.planner_categories
  for select
  to anon, authenticated
  using (true);

-- Published only, enforced here rather than trusted to the application
-- layer - PROMPT 3 Phase 1 §7 is explicit that client-side filtering
-- isn't a security boundary, and both the anon and authenticated
-- publishable-key clients (src/lib/supabase/client.ts, server.ts) can be
-- queried directly by anyone who has them, bypassing whatever
-- src/lib/planners.ts filters in application code. A draft/archived
-- definition is therefore invisible at the database layer to every
-- caller, full stop, not merely unlisted by the current UI. There is no
-- "staff preview a draft" policy yet because there is no staff/role
-- system in auth to key one off - add that policy alongside real roles,
-- not ahead of them.
create policy "Anyone can read published planner definitions"
  on public.planner_definitions
  for select
  to anon, authenticated
  using (status = 'published');
