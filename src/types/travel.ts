/**
 * The Travel Planner's own workspace identity - `public.trips` (see
 * `supabase/migrations/20260907000000_travel_planner_foundation.sql`). One
 * row per account: `ownerId` always equals the creating user's
 * `auth.users.id`, enforced both by the table's `unique (owner_id)`
 * constraint and by RLS - the same shape `Wedding` (`@/types/wedding`)
 * already establishes for a hand-built, purpose-built product.
 *
 * Deliberately unrelated to the generic planner marketplace's
 * `PlannerDefinition`/`PlannerInstance` types - this is a different
 * product with its own relational shape, not an instance of the generic
 * field-answer wizard.
 */
export interface Trip {
  id: string;
  ownerId: string;
  destination: string;
  /** Plain `YYYY-MM-DD` (Postgres `date`, no time component). */
  startDate: string;
  /** Plain `YYYY-MM-DD`. Always on or after `startDate` - enforced by `trips_dates_valid`. */
  endDate: string;
  travelerCount: number;
  tripType: TripType;
  /** `null` means "not set yet" - trip setup never forces a placeholder. */
  tripGoals: string | null;
  /** `null` means "not set yet" - trip setup never forces a placeholder. */
  notes: string | null;
  /** Integer cents. `0` until the traveler sets one on the Budget page (Prompt 3 Phase 1) - not part of trip setup itself. */
  totalBudgetCents: number;
  /** ISO 4217 currency code, e.g. "USD" - the one workspace-level currency every budget/expense amount is formatted in (Prompt 3 Phase 1), same role `Wedding.currency` already plays. */
  currency: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Matches `trips_trip_type_valid` (the migration) exactly - Everplans
 * Travel Planner Prompt 1 Phase 3's own curated list, kept intentionally
 * short rather than an open-ended free-text field.
 */
export type TripType = "vacation" | "family" | "couple" | "solo" | "business" | "road-trip" | "other";

/**
 * Derived, never stored (the same rule `WeddingProgress` follows) - computed
 * from a trip's own fields by `@/lib/travel/progress.ts` at read time, so it
 * can never drift out of sync with the data it summarizes. Deliberately
 * scoped to only what Prompt 1 actually implemented (trip setup fields) -
 * no fake progress for itinerary/budget/bookings/packing/documents, which
 * don't exist yet.
 */
export interface TripSetupProgress {
  completedSteps: number;
  totalSteps: number;
  percent: number;
}

/**
 * One calendar day within a trip that a traveler has actually customized -
 * `public.trip_days` (see `supabase/migrations/20260908000000_travel_planner_itinerary.sql`).
 * A row exists only once a title/notes (or, from Prompt 2 Phase 2 onward,
 * an activity) has been added for that date - not one per calendar day a
 * trip spans, which is derived instead (see `ItineraryDay`).
 */
export interface TripDay {
  id: string;
  tripId: string;
  /** Plain `YYYY-MM-DD`. Always within the parent trip's `startDate`-`endDate` range at the time it was created. */
  dayDate: string;
  title: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * One day of the itinerary as the UI actually shows it - every calendar
 * date between the trip's `startDate` and `endDate` (Prompt 2 Phase 1 §4:
 * "the itinerary must derive correctly from the trip dates"), merged with
 * its `TripDay` record if the traveler has added one yet. `tripDay` is
 * `null` for a day nobody has customized - an honest "nothing here yet",
 * not a row created just to have something to render. Built by
 * `@/lib/travel/itinerary`'s `buildItineraryDays`, never stored as its own
 * shape.
 */
export interface ItineraryDay {
  date: string;
  /** 1-based position within the trip - "Day 1", "Day 2", ... */
  dayNumber: number;
  tripDay: TripDay | null;
  /** This day's activities (Prompt 2 Phase 2), chronological - `[]` for a day nobody has added anything to yet, not a gap to fill. */
  activities: Activity[];
}

/**
 * Matches `trip_activities_category_valid` (the migration) exactly -
 * Everplans Travel Planner Prompt 2 Phase 2's own curated list, the same
 * "closed list, not open text" convention `TripType` already established.
 */
export type ActivityCategory =
  | "sightseeing"
  | "food"
  | "transportation"
  | "accommodation"
  | "entertainment"
  | "shopping"
  | "nature"
  | "other";

/**
 * One planned activity within an itinerary day - `public.trip_activities`
 * (see `supabase/migrations/20260909000000_travel_planner_activities.sql`).
 * Always belongs to exactly one `TripDay`; `startTime`/`endTime` are both
 * `null`-able - an activity may carry no time at all (Prompt 2 Phase 3:
 * "handle activities without a specific time gracefully").
 */
export interface Activity {
  id: string;
  tripDayId: string;
  title: string;
  /** Plain `HH:MM`, 24-hour. `null` means no specific time was set. */
  startTime: string | null;
  /** Plain `HH:MM`. Always on or after `startTime` when both are set. */
  endTime: string | null;
  location: string | null;
  category: ActivityCategory;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * One budget category for a trip - `public.trip_budget_categories` (see
 * `supabase/migrations/20260910000000_travel_planner_budget.sql`).
 * Free-text `name`, not a curated list - unlike `TripType`/`ActivityCategory`,
 * a budget category genuinely varies per traveler (the same "user-created,
 * not closed" shape `WeddingBudgetCategory` already establishes).
 */
export interface TripBudgetCategory {
  id: string;
  tripId: string;
  name: string;
  /** Integer cents. */
  plannedAmountCents: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * One expense against a trip's budget - `public.trip_expenses` (see
 * `supabase/migrations/20260911000000_travel_planner_expenses.sql`).
 * `categoryId` is a real, optional foreign key - `null` means
 * uncategorized, never a category *name* duplicated onto the row, the same
 * shape `WeddingExpense.categoryId` already establishes.
 */
export interface TripExpense {
  id: string;
  tripId: string;
  categoryId: string | null;
  title: string;
  /** Integer cents. */
  amountCents: number;
  /** Plain `YYYY-MM-DD`. */
  expenseDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * The trip budget's full summary (Prompt 3 Phase 1's allocation view,
 * extended by Phase 2 with real spending) - derived, never stored (the
 * same rule every other summary type in this codebase follows), so the
 * overview, the category list, and any future dashboard summary can never
 * disagree with each other.
 *
 * Two genuinely different "what's left" numbers, kept distinct rather than
 * collapsed into one: `remainingCents` is spending-focused (what's left of
 * the total budget after actual expenses - Phase 2's own "clearly
 * distinguish planned/spent/remaining"), `unallocatedCents` is
 * allocation-focused (how much of the total hasn't been assigned to a
 * category yet - Phase 1's own concept, still meaningful once spending
 * exists).
 */
export interface TripBudgetSummary {
  totalBudgetCents: number;
  /** Sum of every category's `plannedAmountCents`. */
  totalPlannedCents: number;
  /** Sum of every expense's `amountCents`. */
  totalActualCents: number;
  /** `totalBudgetCents - totalActualCents` - can go negative (over budget); the UI surfaces that rather than clamping it away. */
  remainingCents: number;
  /** `totalBudgetCents - totalPlannedCents` - can go negative (categories over-allocated relative to the total). */
  unallocatedCents: number;
}

/**
 * Per-category planned/actual/remaining, plus the expenses that landed in
 * each (Phase 2 §6: "category-level planned vs. actual where applicable")
 * - `isOverBudget` is `actual > planned`, calculated fresh each time
 * rather than a stored flag that could go stale the moment a new expense
 * is added. Same shape as `WeddingBudgetCategorySummary`.
 */
export interface TripBudgetCategorySummary {
  category: TripBudgetCategory;
  actualCents: number;
  remainingCents: number;
  isOverBudget: boolean;
  expenses: TripExpense[];
}

/**
 * Matches `trip_bookings_type_valid` (the migration) exactly - Everplans
 * Travel Planner Prompt 3 Phase 3's own curated list, the same "closed
 * list, not open text" convention `TripType`/`ActivityCategory` already
 * established.
 */
export type BookingType = "flight" | "train" | "bus" | "hotel" | "car-rental" | "activity" | "restaurant" | "other";

/** Matches `trip_bookings_status_valid` (the migration) exactly - deliberately three states, the same "avoid unnecessary status complexity" restraint `WeddingPlanningStatus` already applies. */
export type BookingStatus = "planned" | "confirmed" | "cancelled";

/**
 * A centralized record of a reservation the traveler already made
 * elsewhere - `public.trip_bookings` (see
 * `supabase/migrations/20260912000000_travel_planner_bookings.sql`). This
 * is an ORGANIZATION record, not a live booking - Everplans doesn't
 * connect to any external provider to create or verify it (Phase 3's own
 * scope boundary).
 */
export interface Booking {
  id: string;
  tripId: string;
  bookingType: BookingType;
  title: string;
  provider: string | null;
  confirmationNumber: string | null;
  /** Plain `YYYY-MM-DD`. */
  bookingDate: string;
  /** Plain `HH:MM`, 24-hour. `null` means no specific time was set. */
  bookingTime: string | null;
  location: string | null;
  /** Integer cents. `null` means the cost isn't known/entered yet - distinct from `0`, a genuinely free booking. */
  costCents: number | null;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Matches `trip_packing_items_category_valid` (the migration) exactly -
 * Everplans Travel Planner Prompt 4 Phase 1's own short, practical list
 * ("do not create excessive categories"), the same "closed list, not open
 * text" convention `TripType`/`ActivityCategory` already established.
 */
export type PackingCategory = "clothing" | "toiletries" | "electronics" | "travel-documents" | "personal-essentials" | "health" | "other";

/** One packing checklist item - `public.trip_packing_items` (see `supabase/migrations/20260913000000_travel_planner_packing.sql`). */
export interface PackingItem {
  id: string;
  tripId: string;
  name: string;
  category: PackingCategory;
  quantity: number;
  isComplete: boolean;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * The packing checklist's overall progress - derived, never stored (the
 * same rule every other progress type in this codebase follows).
 */
export interface PackingProgress {
  completedCount: number;
  totalCount: number;
  percent: number;
}

/**
 * Matches `trip_documents_type_valid` (the migration) exactly - Everplans
 * Travel Planner Prompt 4 Phase 2's own curated list.
 */
export type TravelDocumentType = "passport" | "visa" | "insurance" | "id" | "tickets" | "booking-confirmation" | "other";

/** Matches `trip_documents_status_valid` (the migration) exactly - deliberately simple (Phase 2 §4: "use a simple, clear model"). */
export type TravelDocumentStatus = "needed" | "ready" | "expired" | "not-required";

/**
 * One travel document checklist entry - `public.trip_documents` (see
 * `supabase/migrations/20260914000000_travel_planner_documents.sql`). This
 * is a CHECKLIST record, not a secure document vault (Phase 2's own
 * security rule) - no file is ever attached, and no sensitive identifiers
 * (passport numbers, card numbers) are ever stored here.
 */
export interface TravelDocument {
  id: string;
  tripId: string;
  documentType: TravelDocumentType;
  name: string;
  status: TravelDocumentStatus;
  /** Plain `YYYY-MM-DD`. `null` means no expiry tracked (e.g. a ticket, or a document type that doesn't expire). */
  expiryDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** One emergency contact for a trip - `public.trip_emergency_contacts` (see `supabase/migrations/20260915000000_travel_planner_information.sql`). The one genuinely new data model Phase 3 introduces - everything else (accommodation/transportation) reuses Prompt 3's bookings, and trip notes reuse the trip's own `notes` field, per Phase 3's own "reuse, don't duplicate" rule. */
export interface EmergencyContact {
  id: string;
  tripId: string;
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
