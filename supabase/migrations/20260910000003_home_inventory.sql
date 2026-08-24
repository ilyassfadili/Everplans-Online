-- Home Planner (Product #4) - Home Inventory (Everplans Home Planner
-- Prompt 2 Phase 2: "Build a useful home inventory system connected
-- naturally to the Home Planner").
--
-- `public.home_inventory_items` is a child table of `public.homes` - the
-- same "child references root, RLS traverses back up" shape
-- `household_members`/`home_contacts`/`home_rooms` already establish.
-- `room_id` is a *nullable* foreign key to `public.home_rooms` with
-- `on delete set null` rather than `on delete cascade` - Phase 2's own
-- data-integrity requirement ("deleting or editing rooms does not
-- silently corrupt inventory data") means removing a room must unassign
-- its items, never delete them.
create table if not exists public.home_inventory_items (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  room_id uuid references public.home_rooms (id) on delete set null,
  name text not null,
  -- Free text constrained by a closed `check` list, not a Postgres enum -
  -- the same "curated in UI, not DB" convention `home_rooms.room_type`
  -- already established.
  category text not null default 'other',
  quantity integer not null default 1,
  purchase_date date,
  purchase_info text,
  -- Integer cents, matching this codebase's one money convention
  -- (`@/lib/budget/currency.ts`'s own comment) - never a float.
  estimated_value_cents integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint home_inventory_items_name_length check (char_length(name) between 1 and 150),
  constraint home_inventory_items_category_valid check (
    category in ('furniture', 'electronics', 'appliances', 'kitchen', 'tools', 'clothing', 'outdoor', 'other')
  ),
  constraint home_inventory_items_quantity_valid check (quantity between 1 and 10000),
  constraint home_inventory_items_purchase_info_length check (purchase_info is null or char_length(purchase_info) <= 500),
  constraint home_inventory_items_estimated_value_valid check (estimated_value_cents is null or estimated_value_cents >= 0),
  constraint home_inventory_items_notes_length check (notes is null or char_length(notes) <= 2000)
);

create index if not exists home_inventory_items_home_id_idx on public.home_inventory_items (home_id);
create index if not exists home_inventory_items_room_id_idx on public.home_inventory_items (room_id);

alter table public.home_inventory_items enable row level security;

-- A single `for all` policy on this child table, the same convention
-- `household_members`/`home_contacts`/`home_rooms` establish: a
-- correlated subquery back to the root's `owner_id`.
create policy "Users can manage their own inventory items" on public.home_inventory_items
  for all to authenticated
  using (exists (select 1 from public.homes h where h.id = home_inventory_items.home_id and h.owner_id = auth.uid()))
  with check (exists (select 1 from public.homes h where h.id = home_inventory_items.home_id and h.owner_id = auth.uid()));

create function public.set_home_inventory_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_home_inventory_items_updated
  before update on public.home_inventory_items
  for each row
  execute function public.set_home_inventory_items_updated_at();
