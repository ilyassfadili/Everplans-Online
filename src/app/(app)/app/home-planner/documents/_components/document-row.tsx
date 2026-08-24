"use client";

import { useState } from "react";
import { File as FileIcon, Pencil, Trash2 } from "lucide-react";

import { Badge, Button, DatePicker, FormField, Icon, Select, Text, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { DOCUMENT_CATEGORY_OPTIONS, getDocumentCategoryLabel } from "@/components/home-planner/document-category-options";
import type { ResolvedHomeRelatedEntity } from "@/lib/home-planner/related-entity";
import type { HomeDocument } from "@/types/home-planner";

import { editDocumentMetadataAction, getDocumentUrlAction, removeDocumentAction } from "../actions";

interface DocumentRowProps {
  document: HomeDocument;
  relatedEntityOptions: { value: string; label: string }[];
  related: ResolvedHomeRelatedEntity | null;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** One document - view opens a fresh signed URL (Phase 2: the bucket is never publicly readable), edit changes metadata only, never the underlying file. */
export function DocumentRow({ document, relatedEntityOptions, related }: DocumentRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleView() {
    setIsOpening(true);
    const url = await getDocumentUrlAction(document.id);
    setIsOpening(false);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  async function handleSave(formData: FormData) {
    setIsSaving(true);
    const result = await editDocumentMetadataAction(document.id, formData);
    setIsSaving(false);

    if (result.status === "success") {
      setError(null);
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  function handleDelete() {
    if (window.confirm(`Remove "${document.title}"? This can't be undone.`)) {
      void removeDocumentAction(document.id);
    }
  }

  if (isEditing) {
    return (
      <li className="py-3">
        <form action={handleSave} className="flex flex-col gap-3 rounded-md border border-line bg-surface-muted/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="title" defaultValue={document.title} maxLength={150} aria-label="Title" required />
            <Select name="category" defaultValue={document.category} options={DOCUMENT_CATEGORY_OPTIONS} aria-label="Category" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DatePicker name="documentDate" defaultValue={document.documentDate ?? undefined} aria-label="Date" />
            {relatedEntityOptions.length > 0 && (
              <Select
                name="relatedEntity"
                defaultValue={related ? `${document.relatedEntity?.type}:${document.relatedEntity?.id}` : ""}
                placeholder="Relates to nothing specific"
                options={relatedEntityOptions}
                aria-label="Relates to"
              />
            )}
          </div>
          <FormField label="Description">
            <Textarea name="description" rows={2} maxLength={1000} defaultValue={document.description ?? ""} />
          </FormField>
          <FormField label="Notes">
            <Textarea name="notes" rows={2} maxLength={2000} defaultValue={document.notes ?? ""} />
          </FormField>
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

  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between">
      <button type="button" onClick={() => void handleView()} disabled={isOpening} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <Icon icon={FileIcon} size="sm" className="text-ink-faint" />
          <Text size="body" weight="medium" className="text-brand underline-offset-4 hover:underline">
            {document.title}
          </Text>
          <Badge variant="neutral">{getDocumentCategoryLabel(document.category)}</Badge>
          {related && <Badge variant="brand">{related.label}</Badge>}
        </div>
        <Text size="body-sm" tone="muted" className="mt-0.5">
          {[document.documentDate, formatFileSize(document.fileSizeBytes)].filter(Boolean).join(" · ")}
        </Text>
      </button>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit "${document.title}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Pencil} size="sm" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label={`Remove "${document.title}"`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </li>
  );
}
