/**
 * The Wedding Planner's own workspace identity - `public.weddings` (see
 * `supabase/migrations/20260823000000_wedding_workspace.sql`). One row per
 * account: `ownerId` always equals the creating user's `auth.users.id`,
 * enforced both by the table's `unique (owner_id)` constraint and by RLS.
 *
 * Deliberately unrelated to the generic planner marketplace's
 * `PlannerDefinition`/`PlannerInstance` types (`@/types/planner-definition`,
 * `@/types/planner-instance`) - this is a different, purpose-built product
 * with its own relational shape, not an instance of the generic
 * field-answer wizard.
 */
export interface Wedding {
  id: string;
  ownerId: string;
  partnerOneName: string;
  partnerTwoName: string;
  /** `null` means "not decided yet" - onboarding never forces a placeholder date. */
  weddingDate: string | null;
  /** ISO 4217 currency code, e.g. "USD" - the one workspace-level currency every budget/expense amount is formatted in (Prompt 3 Phase 2). */
  currency: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Shared by both milestones and tasks - matches
 * `wedding_milestones_status_valid`/`wedding_tasks_status_valid`
 * (`20260824000000_wedding_planning_core.sql`) exactly. Deliberately just
 * three states (Prompt 2 Phase 2: "avoid unnecessary status complexity").
 */
export type WeddingPlanningStatus = "not-started" | "in-progress" | "completed";

export type WeddingTaskPriority = "low" | "medium" | "high";

/**
 * A meaningful planning checkpoint - `public.wedding_milestones`. Not a
 * micro-task: tasks may optionally group under one (`WeddingTask.milestoneId`),
 * but a milestone is a checkpoint in its own right, not a container that
 * requires tasks to have meaning.
 */
export interface WeddingMilestone {
  id: string;
  weddingId: string;
  title: string;
  description: string | null;
  status: WeddingPlanningStatus;
  targetDate: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** `public.wedding_tasks` - the checklist's actual unit of work. */
export interface WeddingTask {
  id: string;
  weddingId: string;
  /** `null` when the task doesn't belong to a milestone - grouping is optional. */
  milestoneId: string | null;
  /** `null` when the task isn't tied to a specific event (Prompt 5 Phase 2) - extends the existing task architecture, not a second one. */
  eventId: string | null;
  title: string;
  description: string | null;
  status: WeddingPlanningStatus;
  priority: WeddingTaskPriority;
  dueDate: string | null;
  /** Set the moment `status` becomes `"completed"`, cleared if it's reopened - never independently editable. */
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Derived, never stored (Phase 2's own "do not duplicate progress values
 * in separate storage" instruction) - computed from a wedding's current
 * tasks by `@/lib/wedding/progress.ts` at read time, so it can never drift
 * out of sync with the data it summarizes.
 */
export interface WeddingProgress {
  totalTasks: number;
  completedTasks: number;
  /** 0 when `totalTasks` is 0 - never divides by zero, never fabricates a number with nothing behind it. */
  percentComplete: number;
}

/**
 * A user-created timeline entry - `public.wedding_important_dates`. The
 * wedding date itself is never one of these rows (see the migration's own
 * comment) - `@/lib/wedding/timeline.ts` merges it in at read time instead.
 */
export interface WeddingImportantDate {
  id: string;
  weddingId: string;
  title: string;
  description: string | null;
  eventDate: string;
  /** `null` when only a day matters, not a specific time. */
  eventTime: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * One entry in the merged timeline (`@/lib/wedding/timeline.ts`) - the
 * wedding date itself, a user-created important date, or a wedding event
 * (Prompt 5 Phase 2: "avoid duplicate manually maintained dates... do not
 * create two conflicting sources of truth" - an event's own date is
 * represented here directly, never copied into a second important-date
 * row). One shared shape so the UI never has to branch on which kind of
 * thing it's rendering; `kind` is the one place that distinction
 * survives, for the cases that genuinely need it (suppressing edit/delete
 * controls on the wedding-date entry, linking an event entry to its own
 * detail page).
 */
export interface TimelineEntry {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  eventTime: string | null;
  kind: "wedding-date" | "important-date" | "event";
}

/** A budget category - `public.wedding_budget_categories`. Monetary amounts are integer minor units (cents), never floating point. */
export interface WeddingBudgetCategory {
  id: string;
  weddingId: string;
  name: string;
  description: string | null;
  plannedAmountCents: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * The minimum vendor identity needed to link spending to who it went to
 * (Prompt 3 Phase 4) - a name and nothing else. Full vendor profiles,
 * contacts, and discovery are Prompt 4's own product, not this one's.
 */
/** Booking-pipeline status (Prompt 4 Phase 3) - matches `wedding_vendors_status_valid` exactly. */
export type WeddingVendorStatus = "prospect" | "considering" | "booked" | "not-proceeding";

export interface WeddingVendor {
  id: string;
  weddingId: string;
  name: string;
  /** Free text, not a fixed enum - a curated option list lives in the UI (Prompt 4 Phase 3: "allow an appropriate Other path"), the column itself stays extensible. */
  category: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  /** An optional spending target - "we expect to spend about $3,000 here." `null` means no target was set; actual spending is always derived from linked expenses, never this field. */
  plannedAmountCents: number | null;
  status: WeddingVendorStatus;
  createdAt: string;
  updatedAt: string;
}

/** Matches `wedding_guests_rsvp_status_valid` exactly. Deliberately three states (Prompt 4 Phase 2: "avoid unnecessary status complexity"). */
export type WeddingGuestRsvpStatus = "not-responded" | "attending" | "not-attending";

/** `public.wedding_guests`. */
export interface WeddingGuest {
  id: string;
  weddingId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  /** Free text relationship/category - "Family," "College Friends" - not a fixed taxonomy. */
  groupLabel: string | null;
  rsvpStatus: WeddingGuestRsvpStatus;
  createdAt: string;
  updatedAt: string;
}

/** Derived RSVP counts - never stored, computed from the current guest list by `@/lib/wedding/guests.ts` at read time. */
export interface GuestRsvpSummary {
  totalGuests: number;
  attending: number;
  notAttending: number;
  notResponded: number;
}

/** A vendor's own financial snapshot, derived from its linked expenses - the same "single source of truth" principle `WeddingBudgetCategorySummary` follows. */
export interface WeddingVendorFinancials {
  vendor: WeddingVendor;
  actualCents: number;
  /** `null` when the vendor has no `plannedAmountCents` set - "remaining" isn't meaningful without a target. */
  remainingCents: number | null;
  isOverBudget: boolean;
  expenses: WeddingExpense[];
}

/** An actual expense - `public.wedding_expenses`. `categoryId`/`vendorId` are both optional references, never duplicated names. */
export interface WeddingExpense {
  id: string;
  weddingId: string;
  categoryId: string | null;
  vendorId: string | null;
  title: string;
  amountCents: number;
  expenseDate: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Derived, never stored (same "single source of truth" principle as
 * `WeddingProgress`) - computed from a wedding's current categories and
 * expenses by `@/lib/wedding/budget.ts` at read time.
 */
export interface WeddingBudgetSummary {
  totalPlannedCents: number;
  totalActualCents: number;
  remainingCents: number;
}

/** One category's own planned/actual/remaining breakdown, plus whichever expenses landed in it. */
export interface WeddingBudgetCategorySummary {
  category: WeddingBudgetCategory;
  actualCents: number;
  remainingCents: number;
  isOverBudget: boolean;
  expenses: WeddingExpense[];
}

/** `public.wedding_venues` (Prompt 5 Phase 1). */
export interface WeddingVenue {
  id: string;
  weddingId: string;
  name: string;
  address: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  website: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * `public.wedding_events` - one unified table for every kind of wedding
 * event. `eventType` is free text with a curated option list in the UI
 * (`@/components/wedding/event-type-options`), not a fixed enum (Phase 1:
 * "do not hardcode these as separate technical systems").
 */
export interface WeddingEvent {
  id: string;
  weddingId: string;
  /** `null` when the event has no formal venue - never required. */
  venueId: string | null;
  name: string;
  description: string | null;
  eventType: string | null;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  updatedAt: string;
}

/** An event with its resolved relationships attached - the detail page's own read shape, never a second copy of vendor/guest/venue/task data. */
export interface WeddingEventDetails {
  event: WeddingEvent;
  venue: WeddingVenue | null;
  vendors: WeddingVendor[];
  guests: WeddingGuest[];
  tasks: WeddingTask[];
}

/**
 * The shared "relates to" shape notes, decisions, and documents all use -
 * matches each table's own `related_entity_type_valid` check constraint
 * exactly. A soft reference (no foreign key spanning six possible target
 * tables - see the migration's own comment); resolving `relatedEntityId`
 * to a real title for display is `@/lib/wedding/related-entity.ts`'s job,
 * not something duplicated onto the note/decision/document row itself.
 */
export type RelatedEntityType = "event" | "venue" | "vendor" | "guest" | "task" | "milestone" | "budget_category";

export interface RelatedEntityRef {
  type: RelatedEntityType;
  id: string;
}

/** `public.wedding_notes` (Prompt 5 Phase 3). */
export interface WeddingNote {
  id: string;
  weddingId: string;
  title: string;
  content: string;
  relatedEntity: RelatedEntityRef | null;
  createdAt: string;
  updatedAt: string;
}

export type WeddingDecisionStatus = "open" | "decided";

/** `public.wedding_decisions` (Prompt 5 Phase 3). */
export interface WeddingDecision {
  id: string;
  weddingId: string;
  title: string;
  description: string | null;
  status: WeddingDecisionStatus;
  relatedEntity: RelatedEntityRef | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * `public.wedding_documents` - metadata only; the file itself lives in
 * the private `wedding-documents` Storage bucket at `storagePath`
 * (`@/lib/wedding/documents.ts` resolves a signed URL on demand, never a
 * permanent public one).
 */
export interface WeddingDocument {
  id: string;
  weddingId: string;
  title: string;
  storagePath: string;
  fileType: string | null;
  fileSizeBytes: number | null;
  relatedEntity: RelatedEntityRef | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * One global search result (Prompt 5 Phase 4) - a uniform shape across
 * every searchable entity, so the search panel never has to know each
 * entity's own fields. `href` always points at the real page that entity
 * already lives on - search introduces no new pages of its own.
 */
export interface WeddingSearchResult {
  type: "task" | "milestone" | "important-date" | "guest" | "vendor" | "event" | "venue" | "note" | "decision" | "document";
  id: string;
  title: string;
  description: string | null;
  href: string;
}
