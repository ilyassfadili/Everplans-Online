import type {
  RelatedEntityRef,
  WeddingBudgetCategory,
  WeddingEvent,
  WeddingGuest,
  WeddingMilestone,
  WeddingTask,
  WeddingVendor,
  WeddingVenue,
} from "@/types/wedding";

/**
 * Resolves a note/decision/document's soft `relatedEntity` reference
 * (Prompt 5 Phase 3) into a display label and a real link to that entity's
 * own page - pure, in-memory lookups over data the caller already fetched,
 * never a per-item database round trip. `null` (unresolvable - the
 * referenced row was since deleted) is a real, expected outcome the UI
 * shows as "no longer available" rather than a broken link.
 */

export interface ResolvedRelatedEntity {
  label: string;
  href: string | null;
}

interface RelatedEntityLookups {
  events: WeddingEvent[];
  venues: WeddingVenue[];
  vendors: WeddingVendor[];
  guests: WeddingGuest[];
  tasks: WeddingTask[];
  milestones: WeddingMilestone[];
  budgetCategories: WeddingBudgetCategory[];
}

export function resolveRelatedEntity(ref: RelatedEntityRef, lookups: RelatedEntityLookups): ResolvedRelatedEntity | null {
  switch (ref.type) {
    case "event": {
      const event = lookups.events.find((item) => item.id === ref.id);
      return event ? { label: event.name, href: `/app/wedding-planner/events/${event.id}` } : null;
    }
    case "venue": {
      const venue = lookups.venues.find((item) => item.id === ref.id);
      return venue ? { label: venue.name, href: `/app/wedding-planner/events` } : null;
    }
    case "vendor": {
      const vendor = lookups.vendors.find((item) => item.id === ref.id);
      return vendor ? { label: vendor.name, href: `/app/wedding-planner/vendors/${vendor.id}` } : null;
    }
    case "guest": {
      const guest = lookups.guests.find((item) => item.id === ref.id);
      return guest ? { label: `${guest.firstName} ${guest.lastName}`, href: `/app/wedding-planner/guests` } : null;
    }
    case "task": {
      const task = lookups.tasks.find((item) => item.id === ref.id);
      return task ? { label: task.title, href: `/app/wedding-planner/checklist` } : null;
    }
    case "milestone": {
      const milestone = lookups.milestones.find((item) => item.id === ref.id);
      return milestone ? { label: milestone.title, href: `/app/wedding-planner` } : null;
    }
    case "budget_category": {
      const category = lookups.budgetCategories.find((item) => item.id === ref.id);
      return category ? { label: category.name, href: `/app/wedding-planner/budget` } : null;
    }
    default:
      return null;
  }
}

/** Options for the notes/decisions "Relates to" picker - one flat list across every linkable entity type, each value encoding `type:id` (Phase 3: "avoid forcing every item into a relationship" - kept to one simple control rather than a two-step type-then-item picker). */
export function buildRelatedEntityOptions(lookups: RelatedEntityLookups): { value: string; label: string }[] {
  return [
    ...lookups.events.map((event) => ({ value: `event:${event.id}`, label: `Event: ${event.name}` })),
    ...lookups.venues.map((venue) => ({ value: `venue:${venue.id}`, label: `Venue: ${venue.name}` })),
    ...lookups.vendors.map((vendor) => ({ value: `vendor:${vendor.id}`, label: `Vendor: ${vendor.name}` })),
    ...lookups.guests.map((guest) => ({ value: `guest:${guest.id}`, label: `Guest: ${guest.firstName} ${guest.lastName}` })),
    ...lookups.tasks.map((task) => ({ value: `task:${task.id}`, label: `Task: ${task.title}` })),
    ...lookups.milestones.map((milestone) => ({ value: `milestone:${milestone.id}`, label: `Milestone: ${milestone.title}` })),
    ...lookups.budgetCategories.map((category) => ({ value: `budget_category:${category.id}`, label: `Budget: ${category.name}` })),
  ];
}
