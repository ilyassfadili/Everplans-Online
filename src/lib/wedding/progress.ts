import type { WeddingProgress, WeddingTask } from "@/types/wedding";

/**
 * Derives overall planning progress from a wedding's current tasks - pure,
 * synchronous, no database access of its own. Deliberately not persisted
 * anywhere (Phase 2's own "do not duplicate progress values in separate
 * storage when they can be derived from source data" instruction): calling
 * this on a freshly-fetched task list is the only source of truth, so it
 * can never disagree with the checklist a visitor is looking at.
 *
 * Task-based, not milestone-based - milestones are checkpoints a couple
 * defines for themselves and may leave open long after their tasks are
 * done (or vice versa), so they're surfaced on the dashboard in their own
 * right rather than folded into one blended percentage.
 */
export function calculateWeddingProgress(tasks: WeddingTask[]): WeddingProgress {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;

  return {
    totalTasks,
    completedTasks,
    percentComplete: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
  };
}
