import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container } from "@/components/ui";
import { getEventsForWedding } from "@/lib/wedding/events";
import { getImportantDatesForWedding } from "@/lib/wedding/important-dates";
import { buildTimeline } from "@/lib/wedding/timeline";
import { getWeddingForCurrentUser } from "@/lib/wedding/weddings";

import { PageHeader } from "../../_components/page-header";
import { AddDateForm } from "./_components/add-date-form";
import { TimelineList } from "./_components/timeline-list";

export const metadata: Metadata = {
  title: "Timeline",
  robots: { index: false, follow: false },
};

/**
 * The Wedding Planner's timeline (Prompt 3 Phase 1, extended in Prompt 5
 * Phase 2) - the wedding date, every important date, and every event, all
 * merged into one chronological list (`buildTimeline`,
 * `@/lib/wedding/timeline`) - an event's own date is never duplicated as a
 * second, manually-maintained important date. Gated the same way every
 * Wedding Planner route is: no workspace yet redirects to onboarding.
 */
export default async function TimelinePage() {
  const wedding = await getWeddingForCurrentUser();

  if (!wedding) {
    redirect("/app/wedding-planner/onboarding");
  }

  const [importantDates, events] = await Promise.all([getImportantDatesForWedding(wedding.id), getEventsForWedding(wedding.id)]);
  const entries = buildTimeline(wedding, importantDates, events);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Timeline" description="Your wedding day and every important date along the way." />
      <AddDateForm weddingId={wedding.id} />
      <TimelineList weddingId={wedding.id} entries={entries} />
    </Container>
  );
}
