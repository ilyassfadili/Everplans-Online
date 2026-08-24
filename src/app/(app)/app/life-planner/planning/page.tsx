import { redirect } from "next/navigation";

/**
 * `/app/life-planner/planning` itself has no content of its own - Weekly
 * and Monthly Planning are two equally-real sibling views (Phase 1 §6), not
 * a parent/child pair, so the bare route redirects to Weekly as the
 * sensible default landing rather than rendering a third "pick one" screen.
 */
export default function PlanningIndexPage() {
  redirect("/app/life-planner/planning/weekly");
}
