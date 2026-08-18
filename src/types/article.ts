/**
 * The shape of a future blog article. Like `Planner`/`Category`, defined
 * ahead of any real content source so the listing and reading-experience
 * architecture has a real contract to build against.
 *
 * `content` is a single HTML string rather than a structured block schema -
 * the simplest contract that a future source (MDX, a headless CMS, a
 * Supabase table) can all realistically produce. A richer block-based model
 * can replace it later if a real source needs one; inventing that
 * structure now, with nothing to validate it against, would be guessing.
 */
export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** Sanitized HTML. Rendered inside `<Prose>`. */
  content: string;
  category: string;
  publishedAt: string;
  readingTimeMinutes: number;
}
