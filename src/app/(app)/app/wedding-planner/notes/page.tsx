import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container } from "@/components/ui";
import { getBudgetCategoriesForWedding } from "@/lib/wedding/budget-categories";
import { getDecisionsForWedding } from "@/lib/wedding/decisions";
import { getDocumentsForWedding } from "@/lib/wedding/documents";
import { getEventsForWedding } from "@/lib/wedding/events";
import { getGuestsForWedding } from "@/lib/wedding/guests";
import { getMilestonesForWedding } from "@/lib/wedding/milestones";
import { getNotesForWedding } from "@/lib/wedding/notes";
import { buildRelatedEntityOptions, resolveRelatedEntity } from "@/lib/wedding/related-entity";
import { getTasksForWedding } from "@/lib/wedding/tasks";
import { getVendorsForWedding } from "@/lib/wedding/vendors";
import { getVenuesForWedding } from "@/lib/wedding/venues";
import { getWeddingForCurrentUser } from "@/lib/wedding/weddings";

import { PageHeader } from "../../_components/page-header";
import { DecisionsSection } from "./_components/decisions-section";
import { DocumentsSection } from "./_components/documents-section";
import { NotesSection } from "./_components/notes-section";

export const metadata: Metadata = {
  title: "Notes",
  robots: { index: false, follow: false },
};

/**
 * Notes, decisions, and documents (Prompt 5 Phase 3) - the Wedding
 * Planner's lightweight information layer, all on one page. Each item can
 * optionally relate to any other real entity (`related-entity.ts`), never
 * a duplicated copy of that entity's own data.
 */
export default async function NotesPage() {
  const wedding = await getWeddingForCurrentUser();

  if (!wedding) {
    redirect("/app/wedding-planner/onboarding");
  }

  const [notes, decisions, documents, events, venues, vendors, guests, tasks, milestones, budgetCategories] = await Promise.all([
    getNotesForWedding(wedding.id),
    getDecisionsForWedding(wedding.id),
    getDocumentsForWedding(wedding.id),
    getEventsForWedding(wedding.id),
    getVenuesForWedding(wedding.id),
    getVendorsForWedding(wedding.id),
    getGuestsForWedding(wedding.id),
    getTasksForWedding(wedding.id),
    getMilestonesForWedding(wedding.id),
    getBudgetCategoriesForWedding(wedding.id),
  ]);

  const lookups = { events, venues, vendors, guests, tasks, milestones, budgetCategories };
  const relatedEntityOptions = buildRelatedEntityOptions(lookups);

  // Resolved server-side, into plain data keyed by id - a function
  // (`resolveRelatedEntity` bound to a per-item closure) can't cross into
  // `NotesSection`/`DecisionsSection`/`DocumentsSection` as a prop, since
  // all three are Client Components and only serializable data survives
  // that boundary. So the lookup runs once, here, and each section
  // receives a plain `Record<string, ResolvedRelatedEntity | null>` instead.
  const noteRelatedById = Object.fromEntries(
    notes.map((note) => [note.id, note.relatedEntity ? resolveRelatedEntity(note.relatedEntity, lookups) : null]),
  );
  const decisionRelatedById = Object.fromEntries(
    decisions.map((decision) => [decision.id, decision.relatedEntity ? resolveRelatedEntity(decision.relatedEntity, lookups) : null]),
  );
  const documentRelatedById = Object.fromEntries(
    documents.map((document) => [document.id, document.relatedEntity ? resolveRelatedEntity(document.relatedEntity, lookups) : null]),
  );

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Notes" description="Everything worth remembering - notes, decisions, and documents in one place." />

      <NotesSection
        weddingId={wedding.id}
        notes={notes}
        relatedEntityOptions={relatedEntityOptions}
        relatedById={noteRelatedById}
      />
      <DecisionsSection
        weddingId={wedding.id}
        decisions={decisions}
        relatedEntityOptions={relatedEntityOptions}
        relatedById={decisionRelatedById}
      />
      <DocumentsSection
        weddingId={wedding.id}
        documents={documents}
        relatedEntityOptions={relatedEntityOptions}
        relatedById={documentRelatedById}
      />
    </Container>
  );
}
