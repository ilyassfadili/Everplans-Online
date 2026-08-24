/**
 * A single in-app notification - Dashboard V2's desktop top bar (Prompt
 * 5's post-launch follow-up: the top bar's original review round flagged
 * "no header" and asked specifically for search plus notifications).
 * Deliberately small, matching `@/types/resource`'s own "not a full CMS"
 * restraint: an identity, a message, when it happened, whether it's been
 * seen, and where it points - nothing resembling a full activity-feed
 * schema.
 */
export interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  /** `null` until read - never a fabricated read/unread split with no real event behind it. */
  readAt: string | null;
  /** Optional: not every notification is about somewhere else to go. */
  href?: string;
}
