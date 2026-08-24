-- Travel Planner (Product #3) - commerce integration (Prompt 6 Phase 1).
--
-- The one `planner_definitions`/`planner_categories` row Travel Planner
-- needs to exist as a valid, known product identity for `public.entitlements`
-- and `public.orders` to reference - the exact same reasoning
-- `20260904000000_orders.sql`'s own comment lays out for Budget Planner:
-- this is about product IDENTITY for commerce, not discovery (Travel
-- Planner is still never a row the generic catalog surfaces - RLS on
-- `planner_definitions` only ever returns `published` rows, and this one
-- stays `status = 'draft'`). `id` matches `TRAVEL_PLANNER_PRODUCT.plannerId`
-- (`@/config/products/travel-planner.ts`), the fixed value reserved there
-- in Prompt 5 specifically so this seeding could arrive later without
-- renumbering anything `orders.planner_id`/`entitlements.planner_id`
-- already points at.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status as every migration in this repo.

insert into public.planner_categories (id, slug, name, description)
values (
  '44444444-4444-4444-8444-444444444444',
  'travel',
  'Travel & Adventures',
  'Trips, itineraries, and travel organization.'
)
on conflict (id) do nothing;

insert into public.planner_definitions (id, slug, title, description, category_id, status, schema_version)
values (
  '33333333-3333-4333-8333-333333333333',
  'travel-planner',
  'Travel Planner',
  'An organized trip-planning workspace - itinerary, budget, bookings, packing, and documents, all in one place.',
  '44444444-4444-4444-8444-444444444444',
  'draft',
  1
)
on conflict (id) do nothing;
