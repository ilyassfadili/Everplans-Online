import type { Metadata } from "next";

import { Alert, Container, Text } from "@/components/ui";
import { getDocumentsForTrip } from "@/lib/travel/documents";
import { requireTripForCurrentUser } from "@/lib/travel/trips";

import { PageHeader } from "../../_components/page-header";
import { DocumentList } from "./_components/document-list";

export const metadata: Metadata = {
  title: "Documents",
  robots: { index: false, follow: false },
};

/**
 * The Travel Planner's document checklist (Everplans Travel Planner Prompt
 * 4 Phase 2) - preparation tracking, not a secure vault (Phase 2's own
 * security rule, restated here in the UI itself per §8: "clearly
 * communicate this is planning/organization"). No file upload, no
 * passport/card numbers - just what document, its status, and when it
 * expires. Gated the same way every Travel Planner route is: no trip yet
 * redirects to trip setup.
 */
export default async function DocumentsPage() {
  const trip = await requireTripForCurrentUser();

  const documents = await getDocumentsForTrip(trip.id);
  const readyCount = documents.filter((document) => document.status === "ready" || document.status === "not-required").length;

  return (
    <Container className="flex flex-1 flex-col gap-6 py-10 md:py-14">
      <PageHeader
        title="Documents"
        description={
          documents.length > 0
            ? `${readyCount} of ${documents.length} ready.`
            : "Keep track of what you need, without storing anything sensitive here."
        }
      />
      <Alert variant="info">
        <Text size="body-sm">
          This is a checklist for staying organized - not a secure vault. Don&rsquo;t enter passport numbers, card
          numbers, or other sensitive details here.
        </Text>
      </Alert>
      <DocumentList tripId={trip.id} documents={documents} />
    </Container>
  );
}
