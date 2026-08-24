/**
 * One shared shape for "a thing the desktop top bar's search can point
 * you at" - a planner definition or a resource today, more sources later
 * without every caller re-branching on which table something came from.
 * `type` is what the result renders as (icon, section grouping); `href`
 * is always where the app already sends you for that same content
 * elsewhere (planner detail routes, `/app/resources`) - never a new
 * destination invented just for search.
 */
export interface WorkspaceSearchResult {
  id: string;
  type: "planner" | "resource";
  title: string;
  description: string;
  href: string;
}
