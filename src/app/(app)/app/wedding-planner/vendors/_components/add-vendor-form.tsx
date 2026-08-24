"use client";

import { useActionState } from "react";

import { Alert, Button, Card, Label, Select } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { VENDOR_CATEGORY_OPTIONS } from "@/components/wedding/vendor-category-options";

import { createVendorFormAction, type CreateVendorFormState } from "../actions";

const initialState: CreateVendorFormState = { status: "idle" };

interface AddVendorFormProps {
  weddingId: string;
}

/** Lightweight vendor creation (Phase 4: "only essential information should be required") - name and an optional category; contact info, status, and notes are added on the vendor's own detail page. */
export function AddVendorForm({ weddingId }: AddVendorFormProps) {
  const action = createVendorFormAction.bind(null, weddingId);
  const [state, formAction, isCreating] = useActionState(action, initialState);

  return (
    <Card variant="standard" padding="lg">
      {state.status !== "idle" && (
        <Alert variant="error" title="Couldn’t add that vendor" className="mb-4">
          {state.message}
        </Alert>
      )}
      <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-vendor-name">Add a vendor</Label>
          <Input id="new-vendor-name" name="name" placeholder="e.g. Riverside Barn" maxLength={150} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-vendor-category">
            Category <span className="font-normal text-ink-faint">(optional)</span>
          </Label>
          <Select id="new-vendor-category" name="category" placeholder="Choose a category" options={VENDOR_CATEGORY_OPTIONS} className="sm:w-52" />
        </div>
        <Button type="submit" loading={isCreating} className="sm:w-auto">
          Add vendor
        </Button>
      </form>
    </Card>
  );
}
