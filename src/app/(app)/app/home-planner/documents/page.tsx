import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container, Eyebrow, Heading, Text } from "@/components/ui";
import { getDocumentsForHome } from "@/lib/home-planner/documents";
import { getHomeForCurrentUser } from "@/lib/home-planner/homes";
import { getInventoryForHome } from "@/lib/home-planner/inventory";
import { buildHomeRelatedEntityOptions, resolveHomeRelatedEntity, type ResolvedHomeRelatedEntity } from "@/lib/home-planner/related-entity";
import { getRoomsForHome } from "@/lib/home-planner/rooms";

import { DocumentList } from "./_components/document-list";
import { UploadDocumentForm } from "./_components/upload-document-form";

export const metadata: Metadata = {
  title: "Documents",
  robots: { index: false, follow: false },
};

/**
 * Documents & Records (Everplans Home Planner Prompt 4 Phase 2). Gated the
 * same way every Home Planner route is: no workspace yet redirects to
 * setup.
 */
export default async function DocumentsPage() {
  const home = await getHomeForCurrentUser();

  if (!home) {
    redirect("/app/home-planner/onboarding");
  }

  const [documents, rooms, inventoryItems] = await Promise.all([
    getDocumentsForHome(home.id),
    getRoomsForHome(home.id),
    getInventoryForHome(home.id),
  ]);

  const relatedEntityOptions = buildHomeRelatedEntityOptions({ rooms, inventoryItems });
  const relatedById: Record<string, ResolvedHomeRelatedEntity | null> = {};
  for (const document of documents) {
    relatedById[document.id] = document.relatedEntity
      ? resolveHomeRelatedEntity(document.relatedEntity, { rooms, inventoryItems })
      : null;
  }

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <div>
        <Eyebrow tone="brand">Home Planner</Eyebrow>
        <Heading as="h1" size="h2" className="mt-2">
          Documents
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
          Important paperwork for {home.name}, organized and easy to find.
        </Text>
      </div>

      <UploadDocumentForm homeId={home.id} relatedEntityOptions={relatedEntityOptions} />
      <DocumentList documents={documents} relatedEntityOptions={relatedEntityOptions} relatedById={relatedById} />
    </Container>
  );
}
