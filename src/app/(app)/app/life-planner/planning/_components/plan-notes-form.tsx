"use client";

import { useActionState } from "react";

import { Alert, Button, FormField, Textarea } from "@/components/ui";

export interface PlanNotesFormState {
  status: "idle" | "invalid" | "error" | "success";
  message?: string;
}

interface PlanNotesFormProps {
  initialNotes: string;
  action: (prevState: PlanNotesFormState, formData: FormData) => Promise<PlanNotesFormState>;
  placeholder: string;
}

const initialState: PlanNotesFormState = { status: "idle" };

/**
 * The "Notes" section shared by both the Weekly and Monthly Planning
 * pages - one free-text field, saved via an explicit "Save notes" button
 * rather than debounced autosave (Phase 1 §4's own preference: "prefer
 * explicit Save for simplicity/consistency with the rest of this
 * codebase's plain-form-action style"). Period-agnostic: which plan's
 * notes this actually saves is entirely `action`'s own concern (the
 * weekly/monthly page each bind their own Server Action to their own
 * plan's id before passing it down), so this component itself never needs
 * to know whether it's editing a `LifeWeeklyPlan` or a `LifeMonthlyPlan`.
 */
export function PlanNotesForm({ initialNotes, action, placeholder }: PlanNotesFormProps) {
  const [state, formAction, isSaving] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.status === "invalid" || state.status === "error" ? (
        <Alert variant="error" title="Couldn't save your notes">
          {state.message}
        </Alert>
      ) : state.status === "success" ? (
        <Alert variant="success" title="Saved">
          Your notes are up to date.
        </Alert>
      ) : null}

      <FormField label="Notes">
        <Textarea name="notes" defaultValue={initialNotes} maxLength={2000} rows={6} placeholder={placeholder} />
      </FormField>

      <Button type="submit" size="sm" loading={isSaving} className="self-start">
        Save notes
      </Button>
    </form>
  );
}
