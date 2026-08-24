"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Badge, Button, DatePicker, Icon, Select, Text, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { DOCUMENT_STATUS_BADGE_VARIANT, DOCUMENT_STATUS_OPTIONS, DOCUMENT_TYPE_OPTIONS, getDocumentStatusLabel, getDocumentTypeLabel } from "@/components/travel/document-options";
import { formatExpiryStatus } from "@/lib/travel/format";
import type { TravelDocumentInput, TravelDocumentMutationResult, DeleteTravelDocumentResult } from "@/lib/travel/documents";
import type { TravelDocument } from "@/types/travel";

interface DocumentRowProps {
  document: TravelDocument;
  onSave: (documentId: string, input: TravelDocumentInput) => Promise<TravelDocumentMutationResult>;
  onDelete: (documentId: string) => Promise<DeleteTravelDocumentResult>;
}

/** One document checklist entry - type, name, status, and optional expiry, editable/deletable inline. */
export function DocumentRow({ document, onSave, onDelete }: DocumentRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    setIsSaving(true);
    setError(null);

    const result = await onSave(document.id, {
      documentType: (formData.get("documentType")?.toString() || "other") as TravelDocumentInput["documentType"],
      name: formData.get("name")?.toString() ?? "",
      status: (formData.get("status")?.toString() || "needed") as TravelDocumentInput["status"],
      expiryDate: formData.get("expiryDate")?.toString() || undefined,
      notes: formData.get("notes")?.toString() || undefined,
    });

    setIsSaving(false);
    if (result.status === "success") {
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that document.");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${document.name}" from your checklist?`)) return;
    setIsDeleting(true);
    const result = await onDelete(document.id);
    if (result.status !== "success") {
      setIsDeleting(false);
      setError(result.message ?? "Couldn't remove that document.");
    }
  }

  if (isEditing) {
    return (
      <li className="rounded-md border border-line bg-surface-muted/40 p-4">
        <form action={handleSave} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="name" defaultValue={document.name} maxLength={150} aria-label="Document name" required />
            <Select name="documentType" options={DOCUMENT_TYPE_OPTIONS} defaultValue={document.documentType} aria-label="Document type" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select name="status" options={DOCUMENT_STATUS_OPTIONS} defaultValue={document.status} aria-label="Status" />
            <DatePicker name="expiryDate" defaultValue={document.expiryDate ?? undefined} aria-label="Expiry date (optional)" placeholder="Expiry date (optional)" />
          </div>
          <Textarea name="notes" defaultValue={document.notes ?? ""} maxLength={500} rows={2} aria-label="Notes (optional)" placeholder="Notes (optional)" />
          {error && (
            <Text size="body-sm" tone="error">
              {error}
            </Text>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isSaving}>
              Save
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </li>
    );
  }

  const expiryStatus = formatExpiryStatus(document.expiryDate);

  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{getDocumentTypeLabel(document.documentType)}</Badge>
          <Badge variant={DOCUMENT_STATUS_BADGE_VARIANT[document.status] ?? "neutral"}>{getDocumentStatusLabel(document.status)}</Badge>
        </div>
        <Text size="body-sm" weight="medium" className="mt-1.5 text-ink">
          {document.name}
        </Text>
        {expiryStatus && (
          <Text size="body-sm" tone={document.status === "expired" ? "warning" : "muted"} className="mt-0.5">
            {expiryStatus}
          </Text>
        )}
        {document.notes && (
          <Text size="body-sm" tone="muted" className="mt-0.5">
            {document.notes}
          </Text>
        )}
        {error && (
          <Text size="body-sm" tone="error" className="mt-0.5">
            {error}
          </Text>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit "${document.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Pencil} size="sm" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label={`Remove "${document.name}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </li>
  );
}
