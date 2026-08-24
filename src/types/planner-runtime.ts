import type { PlannerStructure } from "./planner-structure";

/**
 * Runtime-only concepts: where a customer currently is in a
 * `PlannerStructure`, and what they've entered so far - as distinct from
 * both the structure itself (what the planner is designed to contain,
 * `@/types/planner-structure`) and any eventual persisted record of a
 * customer's data (out of scope for this prompt - see PROMPT 5 Phase 2
 * §2's "Persisted Customer Data" boundary, which this file deliberately
 * does not implement). Everything here is meant to live in local/component
 * state (`useReducer` in `@/components/planner/planner-runtime`), never
 * sent to a table.
 */

/** The value a single field currently holds. `null` means "not answered yet" - distinct from an empty string, which is a real (if invalid for a required field) answer. */
export type FieldValue = string | number | boolean | null;

/** Every field's current value, keyed by `FieldDefinition.id` - flat across the whole planner, not scoped per-page, so progress (`calculatePlannerProgress`) can be computed for pages the customer isn't currently on. */
export type PlannerFieldValues = Record<string, FieldValue>;

/** Where the customer is right now. `currentPageId` alone is enough to resolve position (see `@/lib/planner-runtime`'s page-lookup helpers) - section membership is derived from the structure, not duplicated here. */
export interface PlannerRuntimeState {
  currentPageId: string;
  values: PlannerFieldValues;
  /**
   * Whether the customer has tried to leave the current page while it was
   * incomplete/invalid - the runtime's own "validation state" (PROMPT 5
   * Phase 2 §1 asks for one explicitly). Gates whether `GenericField`
   * shows per-field error text: errors stay hidden while a page is still
   * being filled in for the first time, and only appear once advancing
   * has actually been attempted and blocked - so a required field doesn't
   * show "required" before the customer has had a chance to answer it.
   * Reset to `false` on every page change.
   */
  attemptedAdvance: boolean;
}

/** One field's validation outcome. `incomplete` (missing a required value) is kept distinct from `invalid` (a real value that fails a constraint) so the UI can phrase them differently - "required" reads very differently from "too long." */
export type FieldValidationStatus = "valid" | "incomplete" | "invalid";

export interface FieldValidationResult {
  status: FieldValidationStatus;
  message?: string;
}

/** A page's overall validation outcome - `invalid` if any field is invalid, else `incomplete` if any required field is unanswered, else `valid`. Drives whether `PlannerNavigation`'s "Next" is enabled (see `@/lib/planner-runtime`'s `canAdvanceFromPage`). */
export interface PageValidationResult {
  status: FieldValidationStatus;
  fieldResults: Record<string, FieldValidationResult>;
}

/**
 * Derived, never stored: every value here is computed fresh from a
 * `PlannerStructure` + the current `PlannerFieldValues` (see
 * `calculatePlannerProgress`) - there is no separate "completed pages"
 * list to keep in sync, so progress can never silently drift from what
 * the field values actually say.
 */
export interface PlannerProgress {
  /** 0-based position of the current page in the flattened page list. */
  currentStepIndex: number;
  totalSteps: number;
  completedSteps: number;
  /** 0-100, rounded. `0` when `totalSteps` is `0` (a malformed/empty structure) rather than `NaN`. */
  percentage: number;
}

/** A page together with the section it belongs to - what the flattened navigation list (`flattenPlannerPages`) is a list of. */
export interface FlattenedPlannerPage {
  sectionId: string;
  sectionTitle: string;
  page: PlannerStructure["sections"][number]["pages"][number];
}
