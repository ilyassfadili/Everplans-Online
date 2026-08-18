/**
 * The shape of a future planner product. Defined now because the discovery
 * pages' architecture (collection areas, future card rendering) needs a
 * contract to be built against - but nothing in the current catalog
 * produces a value of this type yet. `planners.length` is always `0` until
 * a real content source exists.
 */
export interface Planner {
  id: string;
  slug: string;
  title: string;
  description: string;
  categoryName: string;
  categorySlug: string;
}

/** Same situation as `Planner` - defined ahead of any real category data. */
export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
}
