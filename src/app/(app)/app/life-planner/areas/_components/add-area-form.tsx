"use client";

import { useActionState, useState } from "react";

import { Alert, Button, Card, FormField, Heading, Select } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";

import { createLifeAreaFormAction, type CreateLifeAreaFormState } from "../actions";
import { AREA_COLOR_OPTIONS, AREA_ICON_OPTIONS } from "./area-visuals";

const initialState: CreateLifeAreaFormState = { status: "idle" };

interface AddAreaFormProps {
  planId: string;
}

/**
 * The Life Areas page's own "add a custom area" form - the codebase's
 * established "plain form action, expand in place" pattern
 * (`AddCategoryForm`, `@/app/(app)/app/budget-planner/categories/_components/add-category-form.tsx`)
 * rather than a new modal/dialog primitive: no `Dialog`-style component
 * exists anywhere in `src/components/ui/`, and introducing one for a single
 * four-field form would add a dependency this codebase's own conventions
 * don't call for.
 */
export function AddAreaForm({ planId }: AddAreaFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const createAction = createLifeAreaFormAction.bind(null, planId);
  const [formState, formAction, isCreating] = useActionState(createAction, initialState);

  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h2" size="h4">
          Add a Life Area
        </Heading>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            Add area
          </Button>
        )}
      </div>

      {isAdding && (
        <form action={formAction} className="mt-4 flex flex-col gap-4 border-t border-line-subtle pt-4">
          {formState.status !== "idle" && (
            <Alert variant="error" title="Couldn't add that area">
              {formState.message}
            </Alert>
          )}

          <FormField label="Name">
            <Input name="name" placeholder="e.g. Faith & Spirituality" maxLength={60} required />
          </FormField>

          <FormField label="Description" hint="Optional - a sentence about what this area covers for you.">
            <Textarea name="description" rows={2} maxLength={300} placeholder="What this area means to you..." />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Icon">
              <Select name="iconKey" defaultValue="other" options={AREA_ICON_OPTIONS} aria-label="Icon" />
            </FormField>
            <FormField label="Color">
              <Select name="colorKey" defaultValue="neutral" options={AREA_COLOR_OPTIONS} aria-label="Color" />
            </FormField>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isCreating}>
              Add area
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
