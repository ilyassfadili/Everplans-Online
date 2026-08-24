import { DatePicker, FormField, Select, Textarea } from "@/components/ui";
import type { SelectOption } from "@/components/ui/form/select";
import { Input } from "@/components/ui/form/input";

import { PROJECT_CATEGORY_OPTIONS } from "./project-category-options";
import { PROJECT_STATUS_OPTIONS } from "./project-status-options";

interface ProjectFormFieldsProps {
  roomOptions: SelectOption[];
  defaultValues?: {
    name?: string;
    description?: string | null;
    category?: string;
    status?: string;
    roomId?: string | null;
    startDate?: string | null;
    targetCompletionDate?: string | null;
    budgetPlannedDollars?: string;
    budgetUsedDollars?: string;
    notes?: string | null;
  };
}

const NO_ROOM_OPTION: SelectOption = { value: "", label: "No room assigned" };

/**
 * The Project form's field markup - shared between the create form and
 * the edit form, the same split every other Home Planner entity form
 * establishes. Matches Phase 3's own scope: name, description, category,
 * status, room, dates, budget, notes - project tasks are managed
 * separately, on the project's own detail page.
 */
export function ProjectFormFields({ roomOptions, defaultValues }: ProjectFormFieldsProps) {
  return (
    <>
      <FormField label="Project name" required>
        <Input name="name" autoComplete="off" placeholder="Kitchen renovation" maxLength={150} defaultValue={defaultValues?.name} />
      </FormField>

      <FormField label="Description" hint="Optional.">
        <Textarea name="description" rows={2} maxLength={1000} defaultValue={defaultValues?.description ?? ""} />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Category" required>
          <Select name="category" options={PROJECT_CATEGORY_OPTIONS} defaultValue={defaultValues?.category ?? "other"} />
        </FormField>
        <FormField label="Status" required>
          <Select name="status" options={PROJECT_STATUS_OPTIONS} defaultValue={defaultValues?.status ?? "planning"} />
        </FormField>
      </div>

      <FormField label="Room" hint="Optional.">
        <Select name="roomId" options={[NO_ROOM_OPTION, ...roomOptions]} defaultValue={defaultValues?.roomId ?? ""} />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Start date" hint="Optional.">
          <DatePicker name="startDate" defaultValue={defaultValues?.startDate ?? undefined} />
        </FormField>
        <FormField label="Target completion" hint="Optional.">
          <DatePicker name="targetCompletionDate" defaultValue={defaultValues?.targetCompletionDate ?? undefined} />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Planned budget" hint="In dollars. Optional.">
          <Input name="budgetPlannedDollars" inputMode="decimal" placeholder="0.00" defaultValue={defaultValues?.budgetPlannedDollars ?? ""} />
        </FormField>
        <FormField label="Spent so far" hint="In dollars. Optional.">
          <Input name="budgetUsedDollars" inputMode="decimal" placeholder="0.00" defaultValue={defaultValues?.budgetUsedDollars ?? ""} />
        </FormField>
      </div>

      <FormField label="Notes" hint="Anything else worth keeping in mind. Optional.">
        <Textarea name="notes" rows={3} maxLength={2000} defaultValue={defaultValues?.notes ?? ""} />
      </FormField>
    </>
  );
}
