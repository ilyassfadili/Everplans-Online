import { FileCheck } from "lucide-react";

import { Button, Card, EmptyState, Text } from "@/components/ui";
import type { TravelDocument } from "@/types/travel";

import { PanelHeader } from "./panel-header";

interface DocumentsSummaryCardProps {
  documents: TravelDocument[];
}

/** The dashboard's documents summary (Prompt 4 Phase 4 §2) - "ready vs. remaining," read from the same list the Documents page itself renders. */
export function DocumentsSummaryCard({ documents }: DocumentsSummaryCardProps) {
  if (documents.length === 0) {
    return (
      <Card variant="standard" padding="lg" className="flex h-full flex-col">
        <PanelHeader icon={FileCheck} title="Documents" />
        <EmptyState
          className="mt-4 border-none bg-transparent px-0 py-6"
          title="No documents tracked yet"
          description="Add a passport, visa, or anything else worth keeping status of."
          action={
            <Button href="/app/travel-planner/documents" variant="secondary" size="sm">
              Add a document
            </Button>
          }
        />
      </Card>
    );
  }

  const readyCount = documents.filter((document) => document.status === "ready" || document.status === "not-required").length;
  const expiredCount = documents.filter((document) => document.status === "expired").length;

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader icon={FileCheck} title="Documents" />
      <div className="mt-4 flex flex-1 flex-col justify-between gap-4">
        <div>
          <Text size="body" weight="medium" className="text-ink">
            {readyCount} of {documents.length} ready
          </Text>
          {expiredCount > 0 && (
            <Text size="body-sm" tone="warning" className="mt-1">
              {expiredCount} {expiredCount === 1 ? "document has" : "documents have"} expired
            </Text>
          )}
        </div>
        <Button href="/app/travel-planner/documents" variant="ghost" size="sm" className="self-start">
          Review documents
        </Button>
      </div>
    </Card>
  );
}
