import type { LifeImportantItemCategory } from "@/types/life-planner";

/**
 * Small, framework-agnostic Important Items formatting/labeling helpers (no
 * `"use client"`) shared by the list page (Server Component), its client
 * cards, and the detail view - the same "plain module, resolved by every
 * layer" split `goal-visuals.ts`/`task-visuals.ts`/`journal-visuals.ts`
 * already establish one module each.
 */

/** Display label for each category - plain title-case, no abbreviation. */
export const IMPORTANT_ITEM_CATEGORY_LABEL: Record<LifeImportantItemCategory, string> = {
  plan: "Plan",
  intention: "Intention",
  milestone: "Milestone",
  reference: "Reference",
  note: "Note",
  other: "Other",
};

/**
 * Badge tint per category - purely a browsing aid (a plan reads differently
 * at a glance from a plain note), never a status/priority signal the way
 * `STATUS_BADGE`/`PRIORITY_BADGE` (`goal-visuals.ts`) are. `brand` is
 * reserved for `"plan"` (the most forward-looking category) and `success`
 * for `"intention"` (a stated commitment); `milestone` borrows the same
 * `warning` tint goal milestones use elsewhere in this product for "a point
 * in time worth noting." `reference`/`note`/`other` stay neutral - purely
 * informational, nothing to draw the eye.
 */
export const IMPORTANT_ITEM_CATEGORY_BADGE: Record<LifeImportantItemCategory, "neutral" | "brand" | "success" | "warning" | "error" | "outline"> = {
  plan: "brand",
  intention: "success",
  milestone: "warning",
  reference: "outline",
  note: "neutral",
  other: "neutral",
};

const EXCERPT_LENGTH = 130;

/**
 * A short, plain-text preview of an item's `content` for the list view - cut
 * at a word boundary near `EXCERPT_LENGTH` characters (never mid-word) with
 * a trailing ellipsis, the same construction `journalExcerpt`
 * (`../../journal/_components/journal-visuals`) uses, kept shorter here to
 * match this list's denser, more reference-oriented card grid.
 */
export function importantItemExcerpt(content: string): string {
  const collapsed = content.replace(/\s+/g, " ").trim();
  if (collapsed.length <= EXCERPT_LENGTH) return collapsed;

  const truncated = collapsed.slice(0, EXCERPT_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${(lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trimEnd()}…`;
}
