import "server-only";

import type { Resource } from "@/types/resource";

/**
 * The Resource Hub's data-access layer - same honest-empty shape as
 * every other data-access function in this codebase. No content source
 * exists yet (Prompt 3's own scope boundary: "do not create a full
 * CMS," "do not create dozens of fake articles"), so this returns `[]`
 * today rather than inventing guides that don't exist.
 */
export async function getResources(): Promise<Resource[]> {
  return [];
}
