/**
 * Small, framework-agnostic Journal formatting helpers (no `"use client"`)
 * shared by the list page (Server Component), its client-side cards, and
 * the detail view - the same "plain module, resolved by every layer" split
 * `goal-visuals.ts`/`task-visuals.ts` already establish one product level
 * up.
 */

/** Same local-midnight parse + short format every date display in this codebase uses (`DatePicker`'s own `dateFormatter`, `formatGoalDate`) - never `toISOString()`, which is UTC and can land on the wrong day near midnight. */
export function formatJournalDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const EXCERPT_LENGTH = 160;

/**
 * A short, plain-text preview of an entry's `content` for the list view - cut
 * at a word boundary near `EXCERPT_LENGTH` characters (never mid-word) with
 * a trailing ellipsis, so the list stays glanceable without ever showing a
 * full entry inline.
 */
export function journalExcerpt(content: string): string {
  const collapsed = content.replace(/\s+/g, " ").trim();
  if (collapsed.length <= EXCERPT_LENGTH) return collapsed;

  const truncated = collapsed.slice(0, EXCERPT_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${(lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trimEnd()}…`;
}
