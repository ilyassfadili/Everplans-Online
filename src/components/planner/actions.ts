"use server";

import {
  completePlannerInstance,
  recordPlannerActivity,
  savePlannerAnswer,
  savePlannerPosition,
} from "@/lib/planner-persistence";
import type { FieldValue } from "@/types/planner-runtime";

/**
 * `PlannerRuntime`'s own Server Actions - thin wrappers around
 * `@/lib/planner-persistence`, the same "component calls a small action
 * file, the action file calls the real data-access function" split every
 * other feature in this codebase already follows
 * (`(app)/app/settings/actions.ts` → `@/lib/profile`). Every action here
 * trusts `instanceId` as given rather than re-deriving it - `@/lib/
 * planner-persistence`'s own functions are what actually enforce
 * ownership (via RLS; see that file's own comment), not this thin layer.
 */

export async function saveAnswerAction(instanceId: string, fieldId: string, value: FieldValue) {
  return savePlannerAnswer(instanceId, fieldId, value);
}

export async function savePositionAction(instanceId: string, pageId: string) {
  return savePlannerPosition(instanceId, pageId);
}

interface FinishPlannerInput {
  instanceId: string;
  plannerId: string;
  plannerName: string;
}

/**
 * Marks the instance complete and logs exactly one real activity event
 * (`"planner-completed"`) - the moment `PlannerRuntime`'s `onFinish`
 * fires, not on every page advance or field change, matching the
 * migration's own "avoid noisy events" restraint.
 */
export async function finishPlannerAction({ instanceId, plannerId, plannerName }: FinishPlannerInput) {
  const result = await completePlannerInstance(instanceId);

  if (result.status === "success") {
    await recordPlannerActivity({
      plannerId,
      instanceId,
      type: "planner-completed",
      description: `Completed ${plannerName}`,
    });
  }

  return result;
}
