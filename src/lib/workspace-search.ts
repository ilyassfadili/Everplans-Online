"use server";

import { getPublishedPlannerDefinitions } from "@/lib/planners";
import { getResources } from "@/lib/resources";
import type { WorkspaceSearchResult } from "@/types/workspace-search";

/**
 * The desktop top bar's search Server Action (`DashboardSearch` calls
 * this directly - a whole `"use server"` file exports callable actions,
 * no separate route handler needed). Queries the same two real,
 * currently-empty discovery sources every other in-app surface already
 * reads (`getPublishedPlannerDefinitions`, `getResources`) - never a
 * third, search-only data source, and never a fabricated result. With an
 * empty catalog today, every real query still correctly returns `[]`;
 * the moment either source has content, this starts finding it without
 * changing.
 *
 * A blank/whitespace-only query returns `[]` outright rather than "every
 * planner and resource" - an empty search box showing nothing is the
 * correct, boring behavior; a full listing belongs to `/app/planners` and
 * `/app/resources`, not this box.
 */
export async function searchWorkspace(query: string): Promise<WorkspaceSearchResult[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return [];
  }

  const [planners, resources] = await Promise.all([getPublishedPlannerDefinitions(), getResources()]);

  const plannerResults: WorkspaceSearchResult[] = planners
    .filter((planner) => planner.title.toLowerCase().includes(trimmed))
    .map((planner) => ({
      id: planner.id,
      type: "planner",
      title: planner.title,
      description: planner.description,
      href: `/app/planners/${planner.slug}`,
    }));

  const resourceResults: WorkspaceSearchResult[] = resources
    .filter((resource) => resource.title.toLowerCase().includes(trimmed))
    .map((resource) => ({
      id: resource.id,
      type: "resource",
      title: resource.title,
      description: resource.description,
      href: "/app/resources",
    }));

  return [...plannerResults, ...resourceResults];
}
