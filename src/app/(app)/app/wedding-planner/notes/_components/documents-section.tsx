"use client";

import { useActionState, useState } from "react";
import { File as FileIcon, Trash2 } from "lucide-react";

import { Alert, Badge, Button, Card, EmptyState, Heading, Icon, Label, Select, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import type { ResolvedRelatedEntity } from "@/lib/wedding/related-entity";
import type { WeddingDocument } from "@/types/wedding";

import { getDocumentUrlAction, removeDocumentAction, uploadDocumentFormAction, type UploadDocumentFormState } from "../actions";

const initialState: UploadDocumentFormState = { status: "idle" };

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentsSectionProps {
  weddingId: string;
  documents: WeddingDocument[];
  relatedEntityOptions: { value: string; label: string }[];
  /** Each document's resolved related-entity label, keyed by document id - see `NotesSectionProps.relatedById`'s own comment for why this is data, not a function prop. */
  relatedById: Record<string, ResolvedRelatedEntity | null>;
}

/**
 * Documents (Prompt 5 Phase 3) - real files in the private
 * `wedding-documents` Storage bucket (`@/lib/wedding/documents`), viewed
 * through a short-lived signed URL fetched on click rather than a
 * permanent link, since the bucket itself is never publicly readable.
 */
export function DocumentsSection({ weddingId, documents, relatedEntityOptions, relatedById }: DocumentsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const uploadAction = uploadDocumentFormAction.bind(null, weddingId);
  const [formState, formAction, isUploading] = useActionState(uploadAction, initialState);

  async function handleView(document: WeddingDocument) {
    setOpeningId(document.id);
    const url = await getDocumentUrlAction(document.id);
    setOpeningId(null);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  function handleDelete(document: WeddingDocument) {
    if (window.confirm(`Remove "${document.title}"?`)) {
      void removeDocumentAction(document.id);
    }
  }

  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h2" size="h4">
          Documents
        </Heading>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            Upload document
          </Button>
        )}
      </div>

      {documents.length === 0 && !isAdding && (
        <EmptyState icon={FileIcon} title="Keep the important paperwork close" description="Upload contracts, quotes, or anything else worth keeping." className="mt-4 py-10" />
      )}

      {documents.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
          {documents.map((document) => {
            const related = relatedById[document.id] ?? null;
            return (
              <li key={document.id} className="flex items-center justify-between gap-3 py-2.5">
                <button type="button" onClick={() => void handleView(document)} disabled={openingId === document.id} className="min-w-0 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <Text size="body" weight="medium" className="text-brand underline-offset-4 hover:underline">
                      {document.title}
                    </Text>
                    {related && <Badge variant="neutral">{related.label}</Badge>}
                  </div>
                  <Text size="body-sm" tone="muted">
                    {formatFileSize(document.fileSizeBytes)}
                  </Text>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(document)}
                  aria-label={`Remove "${document.title}"`}
                  className="-m-1.5 shrink-0 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  <Icon icon={Trash2} size="sm" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {isAdding && (
        <form action={formAction} className="mt-4 flex flex-col gap-3 border-t border-line-subtle pt-4">
          {formState.status !== "idle" && (
            <Alert variant="error" title="Couldn’t upload that document">
              {formState.message}
            </Alert>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-document-title">Title</Label>
            <Input id="new-document-title" name="title" maxLength={150} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-document-file">File</Label>
            <input
              id="new-document-file"
              name="file"
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
              required
              className="text-body-sm text-ink-muted file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-surface file:px-3 file:py-1.5 file:text-body-sm file:font-medium file:text-ink hover:file:bg-surface-muted"
            />
          </div>
          {relatedEntityOptions.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-document-related">
                Relates to <span className="font-normal text-ink-faint">(optional)</span>
              </Label>
              <Select id="new-document-related" name="relatedEntity" placeholder="Nothing specific" options={relatedEntityOptions} />
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isUploading}>
              Upload
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
