"use client";

import { FileCheck } from "lucide-react";

import { EmptyState, Stack } from "@/components/ui";
import type { TravelDocumentInput, TravelDocumentMutationResult } from "@/lib/travel/documents";
import type { TravelDocument } from "@/types/travel";

import { createTravelDocumentAction, deleteTravelDocumentAction, updateTravelDocumentAction } from "../actions";
import { AddDocumentForm } from "./add-document-form";
import { DocumentRow } from "./document-row";

interface DocumentListProps {
  tripId: string;
  documents: TravelDocument[];
}

/** The document checklist - every tracked document, plus add. Bound to `tripId` here so `AddDocumentForm` gets a ready-to-call action without threading it through props. */
export function DocumentList({ tripId, documents }: DocumentListProps) {
  async function handleAdd(input: TravelDocumentInput): Promise<TravelDocumentMutationResult> {
    return createTravelDocumentAction(tripId, input);
  }

  return (
    <Stack gap="4">
      <AddDocumentForm onAdd={handleAdd} />

      {documents.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No documents tracked yet"
          description="Add a passport, visa, or anything else worth keeping status of before you go."
          className="py-14"
        />
      ) : (
        <ul className="flex flex-col divide-y divide-line-subtle rounded-lg border border-line-subtle bg-surface px-4">
          {documents.map((document) => (
            <DocumentRow key={document.id} document={document} onSave={updateTravelDocumentAction} onDelete={deleteTravelDocumentAction} />
          ))}
        </ul>
      )}
    </Stack>
  );
}
