/**
 * The generic resource model - Dashboard V2 Prompt 3 Phase 2 §2. A
 * curated guide/tip/reference, never a full CMS content model - deliberately
 * small, matching "do not create a full CMS."
 */
export interface Resource {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  readingTimeMinutes: number;
  /** Only set when this resource is specifically about one planner/category - most general guidance has none. */
  relatedCategoryName?: string;
}
