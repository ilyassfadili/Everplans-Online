/**
 * The generic activity model - Dashboard V2 Prompt 3 Phase 1 §5's
 * "chronological history of meaningful planning activity." Every event
 * type here describes something that could happen to *any* planner,
 * never something specific to one - no planner-specific activity exists
 * or ever should (see `getRecentActivity`, `@/lib/activity`, for why no
 * real source can produce one of these yet either).
 */
export type ActivityEventType =
  | "planner-started"
  | "section-completed"
  | "progress-updated"
  | "planner-resumed"
  | "planner-completed"
  | "data-updated";

export interface ActivityItem {
  id: string;
  type: ActivityEventType;
  /** Short, human-readable summary - "Completed a section," not a raw event code. */
  description: string;
  /** `null` when the event doesn't concern a specific planner (rare, but the model allows for it rather than forcing every event to fake one). */
  plannerName: string | null;
  occurredAt: string;
  /** Generic, optional key/value detail - never planner-specific structure baked into the type itself. */
  metadata?: Record<string, string>;
}
