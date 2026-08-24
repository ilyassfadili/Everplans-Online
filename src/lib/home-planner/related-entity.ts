import type { HomeRelatedEntityRef, InventoryItem, Room } from "@/types/home-planner";

/**
 * Resolves a document's soft `relatedEntity` reference (Phase 2) into a
 * display label and a real link - pure, in-memory lookups over data the
 * caller already fetched, the same shape `resolveRelatedEntity`
 * (`@/lib/wedding/related-entity`) already establishes. `null`
 * (unresolvable - the referenced row was since deleted) is a real,
 * expected outcome the UI shows as "no longer available," not a broken
 * link.
 */

export interface ResolvedHomeRelatedEntity {
  label: string;
  href: string | null;
}

interface HomeRelatedEntityLookups {
  rooms: Room[];
  inventoryItems: InventoryItem[];
}

export function resolveHomeRelatedEntity(ref: HomeRelatedEntityRef, lookups: HomeRelatedEntityLookups): ResolvedHomeRelatedEntity | null {
  switch (ref.type) {
    case "room": {
      const room = lookups.rooms.find((item) => item.id === ref.id);
      return room ? { label: room.name, href: `/app/home-planner/rooms/${room.id}` } : null;
    }
    case "inventory_item": {
      const item = lookups.inventoryItems.find((item) => item.id === ref.id);
      return item ? { label: item.name, href: "/app/home-planner/inventory" } : null;
    }
    default:
      return null;
  }
}

/** Options for the document "Relates to" picker - one flat list across rooms and inventory items, each value encoding `type:id`, the same shape `buildRelatedEntityOptions` (`@/lib/wedding/related-entity`) establishes. */
export function buildHomeRelatedEntityOptions(lookups: HomeRelatedEntityLookups): { value: string; label: string }[] {
  return [
    ...lookups.rooms.map((room) => ({ value: `room:${room.id}`, label: `Room: ${room.name}` })),
    ...lookups.inventoryItems.map((item) => ({ value: `inventory_item:${item.id}`, label: `Item: ${item.name}` })),
  ];
}
