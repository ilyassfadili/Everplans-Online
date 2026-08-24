import type { ProjectProgress, ProjectTask } from "@/types/home-planner";

/**
 * A project's progress, derived from its tasks at read time - never
 * stored (Phase 3: "provide a clear project progress indicator based on
 * actual project task completion... do not create meaningless or
 * manually manipulated metrics"), the same "derived, never stored" rule
 * `HomeSetupProgress`/`TripSetupProgress` follow. A project with no tasks
 * yet has no meaningful percent to show - callers render "No tasks yet"
 * rather than a misleading 0%.
 */
export function calculateProjectProgress(tasks: ProjectTask[]): ProjectProgress {
  const completedCount = tasks.filter((task) => task.isCompleted).length;
  const totalCount = tasks.length;

  return {
    completedCount,
    totalCount,
    percent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
  };
}
