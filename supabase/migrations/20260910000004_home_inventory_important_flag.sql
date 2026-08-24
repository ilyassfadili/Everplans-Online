-- Home Planner (Product #4) - Important Items (Everplans Home Planner
-- Prompt 2 Phase 3: "This should build on the existing inventory
-- foundation rather than creating a separate duplicate inventory
-- architecture").
--
-- A single boolean flag on the existing `public.home_inventory_items`
-- table, not a second item table - "important" is a property of an
-- inventory item, not a different kind of record. The Important Items view
-- is just this table filtered to `is_important = true`
-- (`getImportantItemsForHome`, `@/lib/home-planner/inventory`), so it can
-- never drift out of sync with the underlying inventory record.
alter table public.home_inventory_items
  add column if not exists is_important boolean not null default false;

create index if not exists home_inventory_items_important_idx
  on public.home_inventory_items (home_id, is_important)
  where is_important = true;
