import "server-only";

import type { Notification } from "@/types/notification";

/**
 * The notification bell's data-access layer - same honest-empty shape as
 * `@/lib/resources.ts` and `@/lib/planners.ts`'s discovery functions. No
 * notification-producing system exists anywhere in this backend yet (no
 * table, no event source, nothing that would generate one) - not "the
 * table exists but nothing's happened," genuinely nothing to read from.
 * Returning `[]` here is the same honest statement those two files
 * already make about their own domains, not a fake "you're all caught
 * up" dressed up as real data.
 */
export async function getNotifications(): Promise<Notification[]> {
  return [];
}
