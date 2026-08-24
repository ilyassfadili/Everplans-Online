-- Life Planner (Product #4) - commerce integration (Prompt 6 Phase 1).
--
-- The one `planner_definitions`/`planner_categories` row Life Planner needs
-- to exist as a valid, known product identity for `public.entitlements` and
-- `public.orders` to reference - the exact same reasoning
-- `20260916000000_travel_planner_commerce.sql`'s own comment lays out for
-- Travel Planner (which itself follows `20260904000000_orders.sql`'s
-- original Budget Planner reasoning): this is about product IDENTITY for
-- commerce, not discovery (Life Planner is still never a row the generic
-- catalog surfaces - RLS on `planner_definitions` only ever returns
-- `published` rows, and this one stays `status = 'draft'`). `id` matches
-- `LIFE_PLANNER_PRODUCT.plannerId` (`@/config/products/life-planner.ts`),
-- reserved with this exact value so `orders.planner_id`/
-- `entitlements.planner_id` never need renumbering later. The category
-- slug (`personal-growth`) matches `lifePlannerLanding.categorySlug`
-- already declared in that same config file.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status as every migration in this repo.

insert into public.planner_categories (id, slug, name, description)
values (
  '55555555-5555-4555-8555-555555555555',
  'personal-growth',
  'Personal Growth & Lifestyle',
  'Life planning, goals, habits, and personal organization.'
)
on conflict (id) do nothing;

insert into public.planner_definitions (id, slug, title, description, category_id, status, schema_version)
values (
  '66666666-6666-4666-8666-666666666666',
  'life-planner',
  'Life Planner',
  'A connected life-planning workspace - life profile, life areas, goals, tasks, habits, routines, weekly & monthly planning, journal, and important information, all in one place.',
  '55555555-5555-4555-8555-555555555555',
  'draft',
  1
)
on conflict (id) do nothing;
