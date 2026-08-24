import { plannerStructureSchema } from "@/types/planner-structure";
import type { FieldDefinition, PlannerStructure } from "@/types/planner-structure";
import type {
  FieldValidationResult,
  FlattenedPlannerPage,
  PageValidationResult,
  PlannerFieldValues,
  PlannerProgress,
} from "@/types/planner-runtime";

/**
 * The generic planner engine's pure logic: navigation, progress, and
 * field/page validation, all as plain functions of a `PlannerStructure`
 * plus the current runtime values - nothing here reads from React state,
 * Supabase, or the DOM. That's deliberate: every function is independently
 * reasoned about and runnable outside a component (this module has no
 * "use client" and no React import at all), which is also what makes it
 * possible to exercise with a standalone fixture script rather than only
 * through a rendered page - see this file's own validation notes in the
 * PROMPT 5 summary for how it was actually run.
 *
 * `@/components/planner/planner-runtime.tsx` is the one place that wraps
 * these functions in `useReducer` for an actual interactive session -
 * this file has no notion of "the current session," only "given this
 * structure and these values, what's true."
 */

/** No structure has zero pages if it passed `plannerStructureSchema` (both `sections` and each section's `pages` require `min(1)`) - but a caller reaching this file with an already-invalid structure (bypassing `parsePlannerStructure`) shouldn't crash a page lookup, so every function below still degrees gracefully to an empty list rather than throwing. */
export function flattenPlannerPages(structure: PlannerStructure): FlattenedPlannerPage[] {
  return structure.sections.flatMap((section) =>
    section.pages.map((page) => ({ sectionId: section.id, sectionTitle: section.title, page })),
  );
}

export function getFirstPlannerPage(structure: PlannerStructure): FlattenedPlannerPage | null {
  return flattenPlannerPages(structure)[0] ?? null;
}

/** `null` covers both "no such page" and "empty structure" identically - a caller asking to resolve an unknown/stale page id (PROMPT 5 Phase 2 §7's "a step no longer exists in the definition") gets a clean, checkable failure rather than an exception. */
export function getPlannerPageById(structure: PlannerStructure, pageId: string): FlattenedPlannerPage | null {
  return flattenPlannerPages(structure).find((entry) => entry.page.id === pageId) ?? null;
}

export function getNextPlannerPage(structure: PlannerStructure, currentPageId: string): FlattenedPlannerPage | null {
  const flattened = flattenPlannerPages(structure);
  const index = flattened.findIndex((entry) => entry.page.id === currentPageId);
  if (index === -1) return null;
  return flattened[index + 1] ?? null;
}

export function getPreviousPlannerPage(
  structure: PlannerStructure,
  currentPageId: string,
): FlattenedPlannerPage | null {
  const flattened = flattenPlannerPages(structure);
  const index = flattened.findIndex((entry) => entry.page.id === currentPageId);
  if (index <= 0) return null;
  return flattened[index - 1] ?? null;
}

export function isFirstPlannerPage(structure: PlannerStructure, pageId: string): boolean {
  return flattenPlannerPages(structure)[0]?.page.id === pageId;
}

export function isLastPlannerPage(structure: PlannerStructure, pageId: string): boolean {
  const flattened = flattenPlannerPages(structure);
  return flattened.length > 0 && flattened[flattened.length - 1]?.page.id === pageId;
}

/**
 * One field's value against its own definition. Every branch is written
 * to fail closed on an unexpected shape (e.g. a `number` field somehow
 * holding a string) rather than assume it's fine - the same "don't trust
 * input that reached here without going through the expected path"
 * principle `@/lib/profile` applies to database writes, applied here to
 * runtime field values instead.
 */
export function validateField(field: FieldDefinition, value: unknown): FieldValidationResult {
  const isEmpty = value === null || value === undefined || value === "";

  if (field.type === "boolean") {
    // A required boolean means "must be affirmatively checked," not
    // "must not be null" - `false` is a complete, valid answer for a
    // non-required boolean, and an incomplete one for a required field
    // (e.g. a consent checkbox), never an "invalid" one - there is no
    // malformed shape a boolean can be in beyond "not yet true."
    if (field.required && value !== true) {
      return { status: "incomplete", message: "This must be checked to continue." };
    }
    return { status: "valid" };
  }

  if (isEmpty) {
    return field.required
      ? { status: "incomplete", message: "This field is required." }
      : { status: "valid" };
  }

  switch (field.type) {
    case "text":
    case "textarea": {
      if (typeof value !== "string") {
        return { status: "invalid", message: "Enter text." };
      }
      if (field.maxLength && value.length > field.maxLength) {
        return { status: "invalid", message: `Keep it under ${field.maxLength} characters.` };
      }
      return { status: "valid" };
    }

    case "number": {
      if (typeof value !== "number" || Number.isNaN(value)) {
        return { status: "invalid", message: "Enter a number." };
      }
      if (field.min !== undefined && value < field.min) {
        return { status: "invalid", message: `Must be at least ${field.min}.` };
      }
      if (field.max !== undefined && value > field.max) {
        return { status: "invalid", message: `Must be at most ${field.max}.` };
      }
      return { status: "valid" };
    }

    case "date": {
      if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
        return { status: "invalid", message: "Enter a valid date." };
      }
      if (field.min && value < field.min) {
        return { status: "invalid", message: `Must be on or after ${field.min}.` };
      }
      if (field.max && value > field.max) {
        return { status: "invalid", message: `Must be on or before ${field.max}.` };
      }
      return { status: "valid" };
    }

    case "select": {
      if (typeof value !== "string" || !field.options.some((option) => option.value === value)) {
        return { status: "invalid", message: "Choose one of the listed options." };
      }
      return { status: "valid" };
    }
  }
}

/** A page's overall status: `invalid` beats `incomplete` beats `valid` - one genuinely malformed answer blocks navigation the same way a missing required one does, and the UI can tell the two apart per-field via `fieldResults`. */
export function validatePlannerPage(
  page: FlattenedPlannerPage["page"],
  values: PlannerFieldValues,
): PageValidationResult {
  const fieldResults: Record<string, FieldValidationResult> = {};
  let worst: FieldValidationResult["status"] = "valid";

  for (const field of page.fields) {
    const result = validateField(field, values[field.id] ?? null);
    fieldResults[field.id] = result;
    if (result.status === "invalid") worst = "invalid";
    else if (result.status === "incomplete" && worst !== "invalid") worst = "incomplete";
  }

  return { status: worst, fieldResults };
}

/** Whether `PlannerNavigation`'s "Next"/"Finish" control should be enabled for the given page. */
export function canAdvanceFromPage(page: FlattenedPlannerPage["page"], values: PlannerFieldValues): boolean {
  return validatePlannerPage(page, values).status === "valid";
}

/**
 * Derived fresh from `structure` + `values` every time - see
 * `PlannerProgress`'s own comment for why there's no separate
 * "completed pages" state to keep in sync. `currentStepIndex` is `-1`
 * when `currentPageId` doesn't resolve to a real page (a stale/invalid
 * step, see PROMPT 5 Phase 2 §7) - callers should treat that the same
 * way `getPlannerPageById` returning `null` is treated, not as "step 0."
 */
export function calculatePlannerProgress(
  structure: PlannerStructure,
  values: PlannerFieldValues,
  currentPageId: string,
): PlannerProgress {
  const flattened = flattenPlannerPages(structure);
  const totalSteps = flattened.length;
  const currentStepIndex = flattened.findIndex((entry) => entry.page.id === currentPageId);
  const completedSteps = flattened.filter((entry) => canAdvanceFromPage(entry.page, values)).length;
  const percentage = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);

  return { currentStepIndex, totalSteps, completedSteps, percentage };
}

/**
 * The one place `unknown` (a future JSONB column's parsed value, a CMS
 * response) becomes a trusted `PlannerStructure` - or a clean `null` if
 * it doesn't. Mirrors `getUserProfile`'s fail-closed shape (`@/lib/profile`):
 * logs the real reason for operators, never throws into a rendering path,
 * never hands the caller a partially-valid structure to work around.
 */
export function parsePlannerStructure(raw: unknown): PlannerStructure | null {
  const result = plannerStructureSchema.safeParse(raw);
  if (!result.success) {
    console.error("parsePlannerStructure: invalid planner structure", result.error.issues);
    return null;
  }
  return result.data;
}
