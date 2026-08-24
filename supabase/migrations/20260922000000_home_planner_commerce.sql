-- Home Planner (Product #4) - commerce integration (Prompt 6 Phase 1).
--
-- The one `planner_definitions`/`planner_categories` row Home Planner
-- needs to exist as a valid, known product identity for
-- `public.entitlements` and `public.orders` to reference - the exact same
-- reasoning `20260916000000_travel_planner_commerce.sql`/
-- `20260921000000_life_planner_commerce.sql` already lay out (which
-- themselves follow `20260904000000_orders.sql`'s original Budget Planner
-- reasoning): this is about product IDENTITY for commerce, not discovery
-- (Home Planner is still never a row the generic catalog surfaces - RLS on
-- `planner_definitions` only ever returns `published` rows, and this one
-- stays `status = 'draft'`). `id` matches `HOME_PLANNER_PRODUCT.plannerId`
-- (`@/config/products/home-planner.ts`), reserved with this exact value so
-- `orders.planner_id`/`entitlements.planner_id` never need renumbering
-- later. The category slug (`home`) matches `homePlannerLanding.categorySlug`
-- already declared in that same config file, and the display name/description
-- match the static public marketing copy already in `@/config/categories.ts`.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status as every migration in this repo.

insert into public.planner_categories (id, slug, name, description)
values (
  '88888888-8888-4888-8888-888888888888',
  'home',
  'Home & Moving',
  'Moving, home projects, renovations, and organization.'
)
on conflict (id) do nothing;

insert into public.planner_definitions (id, slug, title, description, category_id, status, schema_version)
values (
  '77777777-7777-4777-8777-777777777777',
  'home-planner',
  'Home Planner',
  'A connected home-organization workspace - rooms, inventory, maintenance, bills, documents, and projects, all in one place.',
  '88888888-8888-4888-8888-888888888888',
  'draft',
  1
)
on conflict (id) do nothing;
