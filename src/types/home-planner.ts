/**
 * The Home Planner's own workspace identity - `public.homes` (see
 * `supabase/migrations/20260910000000_home_planner_foundation.sql`). One
 * row per account: `ownerId` always equals the creating user's
 * `auth.users.id`, enforced both by the table's `unique (owner_id)`
 * constraint and by RLS - the same shape `Trip`/`Wedding` already
 * establish for a hand-built, purpose-built product.
 *
 * Everplans Home Planner Prompt 1 Phase 1 scope only: the basic home
 * profile fields Phase 2's setup flow collects. Deliberately unrelated to
 * the generic planner marketplace's `PlannerDefinition`/`PlannerInstance`
 * types - this is a different product with its own relational shape, not
 * an instance of the generic field-answer wizard.
 */
export interface Home {
  id: string;
  ownerId: string;
  name: string;
  homeType: HomeType;
  ownershipStatus: OwnershipStatus;
  /** `null` means "not set yet" - home setup never forces a placeholder. */
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  /** Optional additional details about the home. `null` means "not set yet". */
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Matches `homes_home_type_valid` (the migration) exactly. */
export type HomeType = "house" | "apartment" | "condo" | "townhouse" | "mobile-home" | "other";

/** Matches `homes_ownership_status_valid` (the migration) exactly. */
export type OwnershipStatus = "own" | "rent" | "other";

/**
 * Home setup progress, derived from a home's own fields and its household/
 * contact counts at read time - the same "derived, never stored" rule
 * `TripSetupProgress` follows for Travel Planner. Deliberately scoped to
 * only what Prompt 1 actually implemented (profile, household, contacts) -
 * no fake progress for rooms/inventory/maintenance, which don't exist yet.
 */
export interface HomeSetupProgress {
  completedSteps: number;
  totalSteps: number;
  percent: number;
}

/**
 * One household member associated with a home - `public.household_members`,
 * a child table of `public.homes` (the same "child references root, RLS
 * traverses back up" shape `TripDay` establishes against `Trip`).
 */
export interface HouseholdMember {
  id: string;
  homeId: string;
  name: string;
  relationship: HouseholdRelationship;
  /** `null` means "not set yet". */
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Matches `household_members_relationship_valid` (the migration) exactly. */
export type HouseholdRelationship =
  | "self"
  | "spouse-partner"
  | "child"
  | "parent"
  | "roommate"
  | "pet"
  | "other";

/**
 * One room within a home - `public.home_rooms` (see
 * `supabase/migrations/20260910000002_home_rooms.sql`), a child table of
 * `public.homes` (same shape as `HouseholdMember`/`HomeContact`). Everplans
 * Home Planner Prompt 2 Phase 1's own scope: name, type, and optional
 * description/notes - nothing from inventory/maintenance/projects, which
 * don't exist yet.
 */
export interface Room {
  id: string;
  homeId: string;
  name: string;
  roomType: RoomType;
  /** `null` means "not set yet". */
  description: string | null;
  /** `null` means "not set yet". */
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Matches `home_rooms_room_type_valid` (the migration) exactly. */
export type RoomType =
  | "living-room"
  | "bedroom"
  | "kitchen"
  | "bathroom"
  | "office"
  | "dining-room"
  | "garage"
  | "basement"
  | "garden"
  | "other";

/**
 * One home inventory item - `public.home_inventory_items` (see
 * `supabase/migrations/20260910000003_home_inventory.sql`), a child table
 * of `public.homes`. `roomId` is nullable and independent of RLS - an item
 * can exist without a room assignment, and removing its room unassigns it
 * (`on delete set null`) rather than deleting the item (Phase 2: "deleting
 * or editing rooms does not silently corrupt inventory data").
 */
export interface InventoryItem {
  id: string;
  homeId: string;
  /** `null` means unassigned. */
  roomId: string | null;
  name: string;
  category: InventoryCategory;
  quantity: number;
  /** Plain `YYYY-MM-DD`. `null` means "not set yet". */
  purchaseDate: string | null;
  /** `null` means "not set yet". */
  purchaseInfo: string | null;
  /** Integer cents. `null` means "not set yet". */
  estimatedValueCents: number | null;
  /** `null` means "not set yet". */
  notes: string | null;
  /**
   * Whether this item is flagged as important (Prompt 2 Phase 3) - a
   * property of the item itself, not a second record. The Important Items
   * view is this list filtered to `isImportant === true`.
   */
  isImportant: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Matches `home_inventory_items_category_valid` (the migration) exactly. */
export type InventoryCategory =
  | "furniture"
  | "electronics"
  | "appliances"
  | "kitchen"
  | "tools"
  | "clothing"
  | "outdoor"
  | "other";

/**
 * One home maintenance task - `public.home_maintenance_tasks` (see
 * `supabase/migrations/20260910000005_home_maintenance.sql`), a child
 * table of `public.homes`. `roomId` is nullable, same "unassigned rather
 * than deleted when its room is removed" shape `InventoryItem.roomId`
 * establishes.
 */
export interface MaintenanceTask {
  id: string;
  homeId: string;
  /** `null` means unassigned. */
  roomId: string | null;
  name: string;
  /** `null` means "not set yet". */
  description: string | null;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  /** Plain `YYYY-MM-DD`. `null` means "not set yet". */
  dueDate: string | null;
  /** `null` means "not set yet". */
  notes: string | null;
  /** `null` means open/not completed; a timestamp means completed at that time. The one real, stored fact this record's status derives from. */
  completedAt: string | null;
  /** `null` means this task doesn't recur. */
  recurrenceFrequency: MaintenanceRecurrenceFrequency | null;
  /** Only meaningful (and required) when `recurrenceFrequency` is `"custom"`. */
  recurrenceIntervalDays: number | null;
  /** Whether completing this task's series should generate its next occurrence. Only meaningful when `recurrenceFrequency` is set. */
  recurrenceActive: boolean;
  /** `null` on the first task of a series (it IS the root); on every generated successor, the root task's own id - so "every occurrence of this series" is `id = X or seriesRootId = X`. */
  seriesRootId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Matches `home_maintenance_tasks_recurrence_frequency_valid` (the migration) exactly. */
export type MaintenanceRecurrenceFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";

/** Matches `home_maintenance_tasks_category_valid` (the migration) exactly. */
export type MaintenanceCategory =
  | "hvac"
  | "plumbing"
  | "electrical"
  | "appliances"
  | "cleaning"
  | "safety"
  | "exterior"
  | "garden"
  | "general"
  | "other";

/** Matches `home_maintenance_tasks_priority_valid` (the migration) exactly. */
export type MaintenancePriority = "low" | "medium" | "high";

/**
 * A maintenance task's display status - derived, never stored (this
 * table's own migration comment). "Due" means due today or within the
 * next 7 days; "Upcoming" covers everything further out, or with no due
 * date set at all.
 */
export type MaintenanceStatus = "completed" | "overdue" | "due" | "upcoming";

/**
 * One household bill - `public.home_bills` (see
 * `supabase/migrations/20260910000007_home_bills.sql`), a child table of
 * `public.homes`. Recurrence fields mirror `MaintenanceTask`'s exactly (the
 * same reused architecture, not a duplicate one) - `recurrenceFrequency`
 * doubles as the bill's own "frequency," `null` meaning a one-time bill.
 * This is a planning/tracking record, not a payment - `paidAt` just means
 * "marked paid by the user."
 */
export interface Bill {
  id: string;
  homeId: string;
  name: string;
  category: BillCategory;
  /** Integer cents. */
  amountCents: number;
  /** Plain `YYYY-MM-DD`. `null` means "not set yet". */
  dueDate: string | null;
  /** `null` means "not set yet". */
  notes: string | null;
  /** `null` means unpaid; a timestamp means paid at that time. The one real, stored fact this record's status derives from. */
  paidAt: string | null;
  /** `null` means this bill doesn't recur (a one-time bill). */
  recurrenceFrequency: MaintenanceRecurrenceFrequency | null;
  /** Only meaningful (and required) when `recurrenceFrequency` is `"custom"`. */
  recurrenceIntervalDays: number | null;
  /** Whether paying this bill's series should generate its next occurrence. */
  recurrenceActive: boolean;
  /** `null` on the first bill of a series (it IS the root); on every generated successor, the root bill's own id. */
  seriesRootId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Matches `home_bills_category_valid` (the migration) exactly. */
export type BillCategory =
  | "electricity"
  | "water"
  | "gas"
  | "internet"
  | "phone"
  | "insurance"
  | "rent"
  | "mortgage"
  | "subscription"
  | "property-services"
  | "other";

/**
 * A bill's display status - derived, never stored (this table's own
 * migration comment), same shape `MaintenanceStatus` establishes.
 */
export type BillStatus = "paid" | "overdue" | "due" | "upcoming";

/**
 * One home improvement project - `public.home_projects` (see
 * `supabase/migrations/20260910000009_home_projects.sql`), a child table
 * of `public.homes`. Unlike Maintenance/Bills, `status` here is a real
 * stored field the user sets directly - not derived from a date.
 */
export interface Project {
  id: string;
  homeId: string;
  /** `null` means unassigned. */
  roomId: string | null;
  name: string;
  /** `null` means "not set yet". */
  description: string | null;
  category: ProjectCategory;
  status: ProjectStatus;
  /** Plain `YYYY-MM-DD`. `null` means "not set yet". */
  startDate: string | null;
  /** Plain `YYYY-MM-DD`. `null` means "not set yet". */
  targetCompletionDate: string | null;
  /** Integer cents. `null` means "not set yet". */
  budgetPlannedCents: number | null;
  /** Integer cents. `null` means "not tracked yet". */
  budgetUsedCents: number | null;
  /** `null` means "not set yet". */
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Matches `home_projects_category_valid` (the migration) exactly. */
export type ProjectCategory = "renovation" | "repair" | "decoration" | "furniture" | "garden" | "improvement" | "other";

/** Matches `home_projects_status_valid` (the migration) exactly. */
export type ProjectStatus = "planning" | "in_progress" | "on_hold" | "completed";

/**
 * One task within a project - `public.home_project_tasks`, a child table
 * of `public.home_projects`. A project's progress is derived from these
 * at read time (`@/lib/home-planner/project-progress.ts`), never stored.
 */
export interface ProjectTask {
  id: string;
  projectId: string;
  name: string;
  isCompleted: boolean;
  /** Plain `YYYY-MM-DD`. `null` means "not set yet". */
  dueDate: string | null;
  /** `null` means "not set yet". */
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * A project's progress, derived from its tasks at read time - never
 * stored (Phase 3's own instruction: "do not create meaningless or
 * manually manipulated metrics"), the same shape `HomeSetupProgress`/
 * `TripSetupProgress` already establish.
 */
export interface ProjectProgress {
  completedCount: number;
  totalCount: number;
  percent: number;
}

/**
 * A soft "relates to" reference on a document - no foreign key, since a
 * document can point at a room or an inventory item and no single FK
 * constraint can point at two different tables. The same shape
 * `RelatedEntityRef` (`@/types/wedding`) already establishes.
 */
export interface HomeRelatedEntityRef {
  type: HomeRelatedEntityType;
  id: string;
}

/** Matches `home_documents_related_entity_type_valid` (the migration) exactly. */
export type HomeRelatedEntityType = "room" | "inventory_item";

/**
 * One home document - `public.home_documents` (see
 * `supabase/migrations/20260910000008_home_documents.sql`). Metadata only;
 * the file itself lives in the private `home-documents` Storage bucket at
 * `storagePath`.
 */
export interface HomeDocument {
  id: string;
  homeId: string;
  title: string;
  category: HomeDocumentCategory;
  /** `null` means "not set yet". */
  description: string | null;
  /** Plain `YYYY-MM-DD`. `null` means "not set yet". */
  documentDate: string | null;
  storagePath: string;
  fileType: string | null;
  fileSizeBytes: number | null;
  relatedEntity: HomeRelatedEntityRef | null;
  /** `null` means "not set yet". */
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Matches `home_documents_category_valid` (the migration) exactly. */
export type HomeDocumentCategory = "property" | "rental" | "insurance" | "warranty" | "receipt" | "manual" | "record" | "other";

/**
 * One important home-related contact - `public.home_contacts` (see
 * `supabase/migrations/20260910000001_home_planner_contacts.sql`), a child
 * table of `public.homes` (same shape as `HouseholdMember`). Prompt 1
 * Phase 2's own scope: a name, a role, and how to reach them - nothing
 * beyond that yet.
 */
export interface HomeContact {
  id: string;
  homeId: string;
  name: string;
  role: HomeContactRole;
  /** `null` means "not set yet". */
  phone: string | null;
  /** `null` means "not set yet". */
  email: string | null;
  /** `null` means "not set yet". */
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Matches `home_contacts_role_valid` (the migration) exactly. */
export type HomeContactRole =
  | "property-manager"
  | "landlord"
  | "contractor"
  | "emergency-contact"
  | "service-provider"
  | "other";
