"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button, Card, DatePicker, Select, Text, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { DOCUMENT_STATUS_OPTIONS, DOCUMENT_TYPE_OPTIONS } from "@/components/travel/document-options";
import type { TravelDocumentInput, TravelDocumentMutationResult } from "@/lib/travel/documents";

interface AddDocumentFormProps {
  onAdd: (input: TravelDocumentInput) => Promise<TravelDocumentMutationResult>;
}

/** "+ Add document" - collapsed by default, the same restraint `AddActivityForm`/`AddBookingForm` already establish. */
export function AddDocumentForm({ onAdd }: AddDocumentFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    setError(null);

    const result = await onAdd({
      documentType: (formData.get("documentType")?.toString() || "other") as TravelDocumentInput["documentType"],
      name: formData.get("name")?.toString() ?? "",
      status: (formData.get("status")?.toString() || "needed") as TravelDocumentInput["status"],
      expiryDate: formData.get("expiryDate")?.toString() || undefined,
      notes: formData.get("notes")?.toString() || undefined,
    });

    setIsSaving(false);
    if (result.status === "success") {
      setIsOpen(false);
    } else {
      setError(result.message ?? "Couldn't add that document.");
    }
  }

  if (!isOpen) {
    return (
      <Button type="button" variant="secondary" leadingIcon={<Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />} onClick={() => setIsOpen(true)}>
        Add document
      </Button>
    );
  }

  return (
    <Card variant="standard" padding="lg">
      <form action={handleSubmit} className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="name" maxLength={150} aria-label="Document name" placeholder="e.g. Passport" required autoFocus />
          <Select name="documentType" options={DOCUMENT_TYPE_OPTIONS} defaultValue="passport" aria-label="Document type" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select name="status" options={DOCUMENT_STATUS_OPTIONS} defaultValue="needed" aria-label="Status" />
          <DatePicker name="expiryDate" aria-label="Expiry date (optional)" placeholder="Expiry date (optional)" />
        </div>
        <Textarea name="notes" maxLength={500} rows={2} aria-label="Notes (optional)" placeholder="Notes (optional)" />
        {error && (
          <Text size="body-sm" tone="error">
            {error}
          </Text>
        )}
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" loading={isSaving}>
            Add document
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
