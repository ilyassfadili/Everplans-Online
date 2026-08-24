import "server-only";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActivityEventType } from "@/types/activity";
import type { PlannerAnswers, PlannerInstance, PlannerInstanceStatus } from "@/types/planner-instance";
import type { FieldValue } from "@/types/planner-runtime";

/**
 * The User Data & Persistence layer - "does this user's private planner
 * work survive a refresh," backed by `planner_instances`/`planner_answers`/
 * `planner_activity_events`
 * (`supabase/migrations/20260822000000_planner_persistence.sql`). Same
 * shape every other data-access file in this codebase follows:
 * `server-only`, every function resolves its own session via
 * `requireUser()` rather than trusting a caller-supplied `userId`, and
 * RLS (the migration's own policies) is the second, independent
 * enforcement of the same per-user boundary - never the only one.
 *
 * Deliberately separate from `@/lib/planner-runtime.ts`: that file is
 * pure structure/progress *logic* with no I/O of any kind; this file is
 * pure I/O with no planner logic of its own - loading/saving state,
 * never computing progress or validating a page.
 *
 * `instanceId`-scoped functions (`getPlannerAnswers`, `savePlannerAnswer`,
 * `savePlannerPosition`, `completePlannerInstance`) don't re-verify the
 * caller owns that instance beyond what RLS already guarantees (a
 * `select`/`update`/`upsert` against a row that isn't the caller's own
 * simply touches zero rows) - `getOrStartPlannerInstance` is the one
 * place an instance id is ever obtained, and it's always the caller's
 * own by construction.
 */

type PlannerInstanceRow = {
  id: string;
  user_id: string;
  planner_id: string;
  status: string;
  current_page_id: string | null;
  started_at: string | null;
  last_active_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

const INSTANCE_COLUMNS =
  "id, user_id, planner_id, status, current_page_id, started_at, last_active_at, completed_at, created_at, updated_at";

function mapInstanceRow(row: PlannerInstanceRow): PlannerInstance {
  return {
    id: row.id,
    userId: row.user_id,
    plannerId: row.planner_id,
    status: row.status as PlannerInstanceStatus,
    currentPageId: row.current_page_id,
    startedAt: row.started_at,
    lastActiveAt: row.last_active_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Every planner instance the current user has ever started, for
 * `@/lib/dashboard-planners`' `getActivePlanners()` to join against
 * `planner_definitions`/`planner_categories`. Not itself the access
 * check - a caller reaching this function is assumed to already be an
 * authenticated user asking "what have I started," never "can I start
 * this," which is a question only `resolvePlannerAccess` (`@/lib/planners`)
 * answers.
 */
export async function getUserPlannerInstances(): Promise<PlannerInstance[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("planner_instances")
    .select(INSTANCE_COLUMNS)
    .eq("user_id", user.id)
    .order("last_active_at", { ascending: false });

  if (error) {
    console.error("getUserPlannerInstances: failed to load instances", error);
    return [];
  }

  return (data ?? []).map(mapInstanceRow);
}

/**
 * "Open this planner" - returns the caller's existing instance if one
 * exists, or starts a new one. The insert path is real, database-
 * enforced authorization, not merely an app-code convenience: the
 * migration's own insert policy requires a matching *active* entitlement
 * to exist before Postgres allows the row at all (see the migration's
 * own comment) - a caller reaching this function for a planner they
 * aren't entitled to gets a real RLS rejection here, one more layer
 * behind `resolvePlannerAccess`'s own check, never a silently-created
 * instance for content the user shouldn't have.
 *
 * Callers must still call `resolvePlannerAccess` first (the route-level
 * gate `/app/planners/[slug]` already applies) - this function is not a
 * substitute for that check, it's what runs *after* access is confirmed,
 * with the database itself refusing to cooperate if that confirmation
 * was ever bypassed.
 */
export async function getOrStartPlannerInstance(plannerId: string): Promise<PlannerInstance | null> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: selectError } = await supabase
    .from("planner_instances")
    .select(INSTANCE_COLUMNS)
    .eq("user_id", user.id)
    .eq("planner_id", plannerId)
    .maybeSingle();

  if (selectError) {
    console.error("getOrStartPlannerInstance: failed to look up instance", selectError);
    return null;
  }

  if (existing) {
    return mapInstanceRow(existing);
  }

  const now = new Date().toISOString();
  const { data: created, error: insertError } = await supabase
    .from("planner_instances")
    .insert({ user_id: user.id, planner_id: plannerId, status: "not-started", started_at: now, last_active_at: now })
    .select(INSTANCE_COLUMNS)
    .maybeSingle();

  if (insertError || !created) {
    // The real "not entitled" failure mode lands here too (RLS rejects
    // the insert) - logged, not surfaced verbatim, matching the same
    // allowlist-over-pass-through principle every other data-access
    // function in this codebase applies to a raw Postgres error.
    console.error("getOrStartPlannerInstance: failed to start instance", insertError);
    return null;
  }

  return mapInstanceRow(created);
}

/** Every saved answer for one instance, as the flat map `PlannerRuntime` seeds its reducer's initial `values` from. */
export async function getPlannerAnswers(instanceId: string): Promise<PlannerAnswers> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("planner_answers")
    .select("field_id, value")
    .eq("instance_id", instanceId);

  if (error) {
    console.error("getPlannerAnswers: failed to load answers", error);
    return {};
  }

  const answers: PlannerAnswers = {};
  for (const row of data ?? []) {
    answers[row.field_id] = row.value as FieldValue;
  }
  return answers;
}

export interface SavePlannerAnswerResult {
  status: "success" | "error";
  message?: string;
}

/**
 * Upserts exactly one field's answer (`onConflict: "instance_id,field_id"`
 * - the migration's own unique constraint is what makes this a safe,
 * single round trip rather than a select-then-insert-or-update race), and
 * bumps the parent instance's `status`/`last_active_at` in the same call.
 * `status` only ever moves `not-started` → `in-progress` here - reaching
 * `completed` is `completePlannerInstance`'s own, deliberate action, never
 * inferred from an answer save.
 */
export async function savePlannerAnswer(
  instanceId: string,
  fieldId: string,
  value: FieldValue,
): Promise<SavePlannerAnswerResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error: answerError } = await supabase
    .from("planner_answers")
    .upsert({ instance_id: instanceId, field_id: fieldId, value }, { onConflict: "instance_id,field_id" });

  if (answerError) {
    console.error("savePlannerAnswer: failed to save answer", answerError);
    return { status: "error", message: "Couldn't save your answer. Please try again." };
  }

  const { error: instanceError } = await supabase
    .from("planner_instances")
    .update({ status: "in-progress", last_active_at: new Date().toISOString() })
    .eq("id", instanceId)
    .eq("status", "not-started");

  // Deliberately not checked for failure beyond logging: the answer
  // itself already saved successfully above, and a missed status/
  // timestamp bump (e.g. because the row was already `in-progress`, the
  // expected case after the first answer) is not a reason to tell the
  // user their input failed to save.
  if (instanceError) {
    console.error("savePlannerAnswer: failed to update instance status", instanceError);
  }

  return { status: "success" };
}

/** Records the customer's current page as they navigate, so a resumed session lands where they left off rather than always restarting at page one. */
export async function savePlannerPosition(instanceId: string, pageId: string): Promise<SavePlannerAnswerResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("planner_instances")
    .update({ current_page_id: pageId, last_active_at: new Date().toISOString() })
    .eq("id", instanceId);

  if (error) {
    console.error("savePlannerPosition: failed to save position", error);
    return { status: "error", message: "Couldn't save your progress. Please try again." };
  }

  return { status: "success" };
}

/** Marks an instance finished - `PlannerRuntime`'s `onFinish`, wired to persistence. */
export async function completePlannerInstance(instanceId: string): Promise<SavePlannerAnswerResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("planner_instances")
    .update({ status: "completed", completed_at: new Date().toISOString(), last_active_at: new Date().toISOString() })
    .eq("id", instanceId);

  if (error) {
    console.error("completePlannerInstance: failed to mark complete", error);
    return { status: "error", message: "Couldn't save your completion. Please try again." };
  }

  return { status: "success" };
}

interface RecordPlannerActivityInput {
  plannerId: string;
  instanceId: string;
  type: ActivityEventType;
  description: string;
  metadata?: Record<string, string>;
}

/**
 * Logs one real activity event - the minimum foundation
 * `/app/activity`'s own `getRecentActivity` (`@/lib/activity`) needs to
 * eventually read from, per that file's own comment. Deliberately not
 * called on every keystroke (`savePlannerAnswer` never calls this) -
 * only meaningful moments (`PlannerRuntime`'s callers decide which)
 * should ever produce a row, matching the migration's own "avoid noisy
 * events for every insignificant UI action" restraint.
 */
export async function recordPlannerActivity(input: RecordPlannerActivityInput): Promise<void> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("planner_activity_events").insert({
    user_id: user.id,
    planner_id: input.plannerId,
    instance_id: input.instanceId,
    event_type: input.type,
    description: input.description,
    metadata: input.metadata ?? null,
  });

  if (error) {
    // Activity is a nice-to-have record of what happened, not the thing
    // that happened - a failed log write is logged for operators and
    // otherwise swallowed, never surfaced as if the real action (saving
    // an answer, finishing a planner) itself failed.
    console.error("recordPlannerActivity: failed to record event", error);
  }
}
