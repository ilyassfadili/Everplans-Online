"use client";

import { useEffect, useReducer, useRef, useState, useTransition } from "react";

import { Text } from "@/components/ui";
import {
  calculatePlannerProgress,
  canAdvanceFromPage,
  getFirstPlannerPage,
  getNextPlannerPage,
  getPlannerPageById,
  getPreviousPlannerPage,
  isFirstPlannerPage,
  isLastPlannerPage,
  validatePlannerPage,
} from "@/lib/planner-runtime";
import type { PlannerFieldValues, PlannerRuntimeState } from "@/types/planner-runtime";
import type { PlannerStructure } from "@/types/planner-structure";

import { finishPlannerAction, saveAnswerAction, savePositionAction } from "./actions";
import { PlannerNavigation } from "./planner-navigation";
import { PlannerPage } from "./planner-page";
import { PlannerProgress } from "./planner-progress";

interface PlannerRuntimeProps {
  structure: PlannerStructure;
  /** From `getOrStartPlannerInstance` (`@/lib/planner-persistence`) - what every save call in this component is scoped to. */
  instanceId: string;
  plannerId: string;
  plannerName: string;
  /** From `getPlannerAnswers` - seeds the reducer so a returning customer resumes with what they already entered, never a blank form. */
  initialValues: PlannerFieldValues;
  /** From the loaded `PlannerInstance.currentPageId` - `null` (or a page id the structure no longer has) falls back to the first page. */
  initialPageId: string | null;
  /** Called once, when the customer advances past the final page, after `finishPlannerAction` has already persisted completion. */
  onFinish?: () => void;
}

type Action =
  | { type: "SET_FIELD_VALUE"; fieldId: string; value: PlannerFieldValues[string] }
  | { type: "REQUEST_ADVANCE" }
  | { type: "GO_TO_PAGE"; pageId: string };

function reducer(state: PlannerRuntimeState, action: Action): PlannerRuntimeState {
  switch (action.type) {
    case "SET_FIELD_VALUE":
      return { ...state, values: { ...state.values, [action.fieldId]: action.value } };
    case "REQUEST_ADVANCE":
      return { ...state, attemptedAdvance: true };
    case "GO_TO_PAGE":
      return { ...state, currentPageId: action.pageId, attemptedAdvance: false };
  }
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

const ANSWER_SAVE_DEBOUNCE_MS = 600;

/**
 * The generic Planner Runtime, now wired to real persistence
 * (`@/lib/planner-persistence`, via `./actions.ts`) - PROMPT 5's original
 * Client Component boundary is unchanged; what's new is that field
 * changes and page navigation no longer live in local state alone.
 *
 * Save strategy (User Data & Persistence Foundation §3): every field
 * change updates local state immediately (the input never waits on a
 * round trip to feel responsive), then debounces the actual
 * `saveAnswerAction` call by `ANSWER_SAVE_DEBOUNCE_MS` - typing five
 * characters produces one save, not five. Page navigation
 * (`savePositionAction`) saves immediately on advance/back, not
 * debounced - it's an infrequent, discrete action, not a stream of
 * keystrokes, and a customer who navigates away should have their
 * position captured before they go, not half a second later.
 *
 * Failure handling: a failed save never discards what the customer
 * typed - `state.values` (local, already updated) is untouched by a
 * failed `saveAnswerAction` call, only `saveStatus` flips to `"error"`
 * so `PlannerProgress`'s own status line can say so and the next edit
 * (or the debounce timer itself, unchanged) naturally retries. Nothing
 * here claims "saved" before the action actually resolves successfully.
 */
export function PlannerRuntime({
  structure,
  instanceId,
  plannerId,
  plannerName,
  initialValues,
  initialPageId,
  onFinish,
}: PlannerRuntimeProps) {
  const firstPage = getFirstPlannerPage(structure);
  // A stale `initialPageId` (the structure changed since the customer was
  // last here, and that page no longer exists) falls back to the first
  // page rather than crashing the initial render - the same "degrade
  // gracefully to page one" resilience `getPlannerPageById` already
  // documents for a mid-session stale id.
  const resolvedInitialPageId =
    (initialPageId && getPlannerPageById(structure, initialPageId)?.page.id) || (firstPage?.page.id ?? "");

  const [state, dispatch] = useReducer(reducer, {
    currentPageId: resolvedInitialPageId,
    values: initialValues,
    attemptedAdvance: false,
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isFinishing, startFinishing] = useTransition();
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Debounced per-field save - a fresh edit to the same field resets
  // that field's own timer rather than queuing a second, now-stale save
  // behind the first. Captures the ref's map object itself (not just its
  // current contents) on mount - `saveTimers.current` never gets
  // reassigned to a new object after that, only mutated in place, so this
  // closure and any later `handleFieldChange` call agree on the same map.
  useEffect(() => {
    const timers = saveTimers.current;
    return () => {
      for (const timer of Object.values(timers)) clearTimeout(timer);
    };
  }, []);

  const current = getPlannerPageById(structure, state.currentPageId);

  if (!current) {
    // A malformed/empty structure, or a stale currentPageId pointing at a
    // page that no longer exists (PROMPT 5 Phase 2 §7) - fails to a
    // plain, honest message rather than rendering a blank/broken form.
    return <p className="text-body text-ink-muted">This planner isn&rsquo;t available right now.</p>;
  }

  const validation = validatePlannerPage(current.page, state.values);
  const progress = calculatePlannerProgress(structure, state.values, state.currentPageId);
  const canAdvance = canAdvanceFromPage(current.page, state.values);

  function handleFieldChange(fieldId: string, value: PlannerFieldValues[string]) {
    dispatch({ type: "SET_FIELD_VALUE", fieldId, value });

    const existingTimer = saveTimers.current[fieldId];
    if (existingTimer) clearTimeout(existingTimer);

    setSaveStatus("saving");
    saveTimers.current[fieldId] = setTimeout(() => {
      saveAnswerAction(instanceId, fieldId, value)
        .then((result) => setSaveStatus(result.status === "success" ? "saved" : "error"))
        .catch(() => setSaveStatus("error"));
    }, ANSWER_SAVE_DEBOUNCE_MS);
  }

  function goToPage(pageId: string) {
    dispatch({ type: "GO_TO_PAGE", pageId });
    savePositionAction(instanceId, pageId).catch(() => {
      // Position is a convenience (where to resume), not the customer's
      // actual data - a failed position save doesn't block navigation or
      // surface an error state the way a failed answer save does.
    });
  }

  function handleAdvance() {
    if (!canAdvance) {
      dispatch({ type: "REQUEST_ADVANCE" });
      return;
    }

    if (isLastPlannerPage(structure, state.currentPageId)) {
      startFinishing(async () => {
        const result = await finishPlannerAction({ instanceId, plannerId, plannerName });
        if (result.status === "success") {
          onFinish?.();
        } else {
          setSaveStatus("error");
        }
      });
      return;
    }

    const next = getNextPlannerPage(structure, state.currentPageId);
    if (next) goToPage(next.page.id);
  }

  function handlePrevious() {
    const previous = getPreviousPlannerPage(structure, state.currentPageId);
    if (previous) goToPage(previous.page.id);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <PlannerProgress progress={progress} />
        {saveStatus !== "idle" && (
          <Text size="caption" tone={saveStatus === "error" ? undefined : "faint"} className={saveStatus === "error" ? "text-error" : undefined}>
            {saveStatus === "saving" && "Saving…"}
            {saveStatus === "saved" && "Saved"}
            {saveStatus === "error" && "Couldn't save your last answer - check your connection and try again."}
          </Text>
        )}
      </div>
      <PlannerPage
        sectionTitle={current.sectionTitle}
        page={current.page}
        values={state.values}
        validation={validation}
        showValidation={state.attemptedAdvance}
        onFieldChange={handleFieldChange}
      />
      <PlannerNavigation
        isFirstPage={isFirstPlannerPage(structure, state.currentPageId)}
        isLastPage={isLastPlannerPage(structure, state.currentPageId)}
        canAdvance={canAdvance}
        isSubmitting={isFinishing}
        onPrevious={handlePrevious}
        onAdvance={handleAdvance}
      />
    </div>
  );
}
