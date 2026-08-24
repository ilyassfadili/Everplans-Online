import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container } from "@/components/ui";
import { getMilestonesForWedding } from "@/lib/wedding/milestones";
import { getTasksForWedding } from "@/lib/wedding/tasks";
import { getWeddingForCurrentUser } from "@/lib/wedding/weddings";

import { PageHeader } from "../../_components/page-header";
import { AddTaskForm } from "./_components/add-task-form";
import { ChecklistView } from "./_components/checklist-view";

export const metadata: Metadata = {
  title: "Checklist",
  robots: { index: false, follow: false },
};

/**
 * The Wedding Planner's full checklist (Prompt 2 Phase 3 + 4) - every task
 * across the wedding, with quick creation, status/priority/due-date
 * editing, filtering, and sorting. Gated the same way every Wedding
 * Planner route is: no workspace yet redirects to onboarding, rather than
 * showing a checklist with nothing to attach tasks to.
 */
export default async function ChecklistPage() {
  const wedding = await getWeddingForCurrentUser();

  if (!wedding) {
    redirect("/app/wedding-planner/onboarding");
  }

  const [milestones, tasks] = await Promise.all([
    getMilestonesForWedding(wedding.id),
    getTasksForWedding(wedding.id),
  ]);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Checklist" description="Everything on your plan, in one place." />
      <AddTaskForm weddingId={wedding.id} milestones={milestones} />
      <ChecklistView tasks={tasks} milestones={milestones} />
    </Container>
  );
}
