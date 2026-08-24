"use client";

import { useActionState } from "react";

import { Alert, Button, Card, DatePicker, FormField, Label, Select, Stack, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { DOCUMENT_CATEGORY_OPTIONS } from "@/components/home-planner/document-category-options";

import { uploadDocumentFormAction, type UploadDocumentFormState } from "../actions";

const initialState: UploadDocumentFormState = { status: "idle" };

interface UploadDocumentFormProps {
  homeId: string;
  relatedEntityOptions: { value: string; label: string }[];
}

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp";

/** The upload-document form - real Storage upload (Phase 2: never a fake "uploaded" state), the same shape `DocumentsSection` (Wedding Planner) establishes. */
export function UploadDocumentForm({ homeId, relatedEntityOptions }: UploadDocumentFormProps) {
  const action = uploadDocumentFormAction.bind(null, homeId);
  const [state, formAction, isUploading] = useActionState(action, initialState);

  return (
    <Card variant="standard" padding="lg">
      {state.status !== "idle" && (
        <Alert variant="error" title="Couldn’t upload that document" className="mb-4">
          {state.message}
        </Alert>
      )}
      <form action={formAction} noValidate>
        <Stack gap="4">
          <FormField label="Title" required>
            <Input name="title" maxLength={150} placeholder="Homeowners insurance policy" />
          </FormField>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-document-file">File</Label>
            <input
              id="new-document-file"
              name="file"
              type="file"
              accept={ACCEPTED_TYPES}
              required
              className="text-body-sm text-ink-muted file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-surface file:px-3 file:py-1.5 file:text-body-sm file:font-medium file:text-ink hover:file:bg-surface-muted"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Category" required>
              <Select name="category" options={DOCUMENT_CATEGORY_OPTIONS} defaultValue="other" />
            </FormField>
            <FormField label="Date" hint="Optional.">
              <DatePicker name="documentDate" />
            </FormField>
          </div>

          {relatedEntityOptions.length > 0 && (
            <FormField label="Relates to" hint="Optional.">
              <Select name="relatedEntity" placeholder="Nothing specific" options={relatedEntityOptions} />
            </FormField>
          )}

          <FormField label="Description" hint="Optional.">
            <Textarea name="description" rows={2} maxLength={1000} />
          </FormField>

          <FormField label="Notes" hint="Optional.">
            <Textarea name="notes" rows={2} maxLength={2000} />
          </FormField>

          <Button type="submit" loading={isUploading} className="self-start">
            Upload document
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
