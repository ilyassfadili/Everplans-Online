/**
 * Formats an ISO timestamp as a human-friendly relative label ("Just
 * now," "15 minutes ago," "Yesterday," "3 days ago"), falling back to a
 * real short date once the gap exceeds a week (where "9 days ago" stops
 * being more useful than the actual date). Originally written inline in
 * `PlannerCard` (Dashboard V2 Prompt 2); extracted here once
 * `ActivityTimeline` (Prompt 3) needed the identical formatting - a
 * second real caller, not a speculative one, which is what makes
 * extracting it now the right call rather than premature abstraction.
 */
export function formatRelativeTime(iso: string | null): string | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;

  const diffMinutes = Math.floor((Date.now() - then) / 60_000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return new Date(then).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
