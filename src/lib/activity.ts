import "server-only";

import { requireUser } from "@/lib/auth/dal";
import { getPlannerDefinitionsByIds } from "@/lib/planners";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActivityEventType, ActivityItem } from "@/types/activity";

const ACTIVITY_LIMIT = 50;

/**
 * The Activity data-access layer - now a real query against
 * `planner_activity_events`
 * (`supabase/migrations/20260822000000_planner_persistence.sql`), not a
 * stub. `recordPlannerActivity` (`@/lib/planner-persistence`) is this
 * table's only writer today (called from `@/components/planner/actions.ts`
 * at real, meaningful moments - see that file's own comment on which);
 * this function is purely the read side. `plannerName` is resolved via a
 * second lookup (`getPlannerDefinitionsByIds`) rather than a stored
 * denormalized column - the same "derive, don't duplicate" preference
 * `getActivePlanners` (`@/lib/dashboard-planners`) already applies to
 * progress, kept here for the same reason: a planner's name can never
 * drift out of sync with an activity row that just quotes it.
 *
 * Still always `[]` in practice today: `planner_activity_events` can
 * only ever gain rows once a real planner runtime session completes a
 * meaningful action, which requires a real `PlannerStructure` that
 * doesn't exist yet (see `@/lib/planners`' own comment) - the same
 * "real signature, honest empty" shape every other data-access function
 * in this codebase follows.
 */
export async function getRecentActivity(): Promise<ActivityItem[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("planner_activity_events")
    .select("id, planner_id, event_type, description, metadata, occurred_at")
    .eq("user_id", user.id)
    .order("occurred_at", { ascending: false })
    .limit(ACTIVITY_LIMIT);

  if (error) {
    console.error("getRecentActivity: failed to load activity", error);
    return [];
  }

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const plannerIds = [...new Set(rows.map((row) => row.planner_id))];
  const definitions = await getPlannerDefinitionsByIds(plannerIds);
  const nameById = new Map(definitions.map((definition) => [definition.id, definition.title]));

  return rows.map((row) => ({
    id: row.id,
    type: row.event_type as ActivityEventType,
    description: row.description,
    plannerName: nameById.get(row.planner_id) ?? null,
    occurredAt: row.occurred_at,
    metadata: (row.metadata as Record<string, string> | null) ?? undefined,
  }));
}
