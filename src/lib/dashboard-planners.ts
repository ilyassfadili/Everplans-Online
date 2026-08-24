import "server-only";

import { calculatePlannerProgress, getFirstPlannerPage, getPlannerPageById } from "@/lib/planner-runtime";
import { getPlannerAnswers, getUserPlannerInstances } from "@/lib/planner-persistence";
import { getPlannerCategories, getPlannerDefinitionsByIds, getPlannerStructure } from "@/lib/planners";
import type { DashboardPlanner } from "@/types/dashboard-planner";

/**
 * The Dashboard's planner-progress data-access layer - now a real join
 * (User Data & Persistence Foundation §7: "My Planners... consume
 * persisted user planner state," never hardcoded values), not a stub.
 * Three real sources, joined:
 *
 * 1. `getUserPlannerInstances()` (`@/lib/planner-persistence`) - which
 *    planners this user has actually started. This is the ownership
 *    boundary: a planner the user hasn't opened never appears here, even
 *    if it's entitled and published (that's the Store's job to show).
 * 2. `getPlannerDefinitionsByIds()`/`getPlannerCategories()`
 *    (`@/lib/planners`) - the catalog identity (name, category, cover)
 *    for each instance's planner.
 * 3. `getPlannerStructure()` + `getPlannerAnswers()` - if a real
 *    structure exists for a planner, real progress is computed from it
 *    via `calculatePlannerProgress` (`@/lib/planner-runtime`'s pure
 *    engine logic, the exact same function `PlannerRuntime` itself
 *    calls) - never a second, independent progress calculation that
 *    could drift from what the runtime shows. Still always `[]` in
 *    practice today: `getUserPlannerInstances` can only ever return
 *    instances for planners that exist, and none do yet (see
 *    `@/lib/planners`' own comment) - but the join itself is real,
 *    exercised code, not a placeholder waiting to be replaced.
 */
export async function getActivePlanners(): Promise<DashboardPlanner[]> {
  const instances = await getUserPlannerInstances();
  if (instances.length === 0) return [];

  const [definitions, categories] = await Promise.all([
    getPlannerDefinitionsByIds(instances.map((instance) => instance.plannerId)),
    getPlannerCategories(),
  ]);
  const definitionById = new Map(definitions.map((definition) => [definition.id, definition]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const planners = await Promise.all(
    instances.map(async (instance): Promise<DashboardPlanner | null> => {
      const definition = definitionById.get(instance.plannerId);
      // An instance whose planner definition can no longer be resolved
      // (deleted out from under it) - skipped rather than rendered as a
      // broken card with no name/category to show.
      if (!definition) return null;

      const structure = await getPlannerStructure(definition.id, definition.schemaVersion);

      let progressPercentage = 0;
      let completedSections = 0;
      let totalSections = 0;
      let nextAction: string | null = null;

      if (structure) {
        const answers = await getPlannerAnswers(instance.id);
        const currentPageId = instance.currentPageId ?? getFirstPlannerPage(structure)?.page.id ?? "";
        const progress = calculatePlannerProgress(structure, answers, currentPageId);
        progressPercentage = progress.percentage;
        completedSections = progress.completedSteps;
        totalSections = progress.totalSteps;

        if (instance.status !== "completed") {
          const currentPage = getPlannerPageById(structure, currentPageId);
          nextAction = currentPage ? `Continue "${currentPage.page.title}"` : "Continue planning";
        }
      }

      return {
        id: definition.id,
        slug: definition.slug,
        name: definition.title,
        categoryName: categoryById.get(definition.categoryId)?.name ?? "",
        description: definition.description,
        progressPercentage,
        completedSections,
        totalSections,
        lastActiveAt: instance.lastActiveAt,
        nextAction,
        status: instance.status,
        coverImageUrl: definition.coverImageUrl,
      };
    }),
  );

  return planners.filter((planner) => planner !== null);
}

/**
 * Deterministic "what should I do next" logic (Dashboard V2 Prompt 2
 * Phase 2 §6) - no AI, no recommendation engine, just a plain rule
 * applied to whatever `getActivePlanners()` returns: prefer the most
 * recently active planner that isn't finished yet (continue what you were
 * doing), and only fall back to the most recently *completed* one (review
 * it) when every active planner is done. Planners with no known
 * `lastActiveAt` sort last within their group rather than crashing a
 * comparison or being treated as "most recent" by an accidental `null`
 * coercion - a planner nobody has touched yet is a weaker "next" signal
 * than one with a real, recent timestamp.
 *
 * Returns `null` when there's nothing to recommend (no planners at all) -
 * callers should render no banner in that case, not a broken one.
 */
export function getRecommendedPlanner(planners: DashboardPlanner[]): DashboardPlanner | null {
  if (planners.length === 0) return null;

  const byRecency = (a: DashboardPlanner, b: DashboardPlanner) => {
    const aTime = a.lastActiveAt ? Date.parse(a.lastActiveAt) : -Infinity;
    const bTime = b.lastActiveAt ? Date.parse(b.lastActiveAt) : -Infinity;
    return bTime - aTime;
  };

  const inProgress = planners.filter((planner) => planner.status !== "completed").sort(byRecency);
  if (inProgress.length > 0) return inProgress[0]!;

  const completed = [...planners].sort(byRecency);
  return completed[0] ?? null;
}
