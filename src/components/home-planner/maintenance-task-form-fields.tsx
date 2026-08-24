import { DatePicker, FormField, Select, Textarea } from "@/components/ui";
import type { SelectOption } from "@/components/ui/form/select";
import { Input } from "@/components/ui/form/input";
import { RECURRENCE_FREQUENCY_OPTIONS } from "@/lib/home-planner/recurrence";

import { MAINTENANCE_CATEGORY_OPTIONS } from "./maintenance-category-options";
import { MAINTENANCE_PRIORITY_OPTIONS } from "./maintenance-priority-options";

interface MaintenanceTaskFormFieldsProps {
  roomOptions: SelectOption[];
  defaultValues?: {
    name?: string;
    description?: string | null;
    category?: string;
    priority?: string;
    roomId?: string | null;
    dueDate?: string | null;
    notes?: string | null;
    recurrenceFrequency?: string | null;
    recurrenceIntervalDays?: number | null;
  };
}

const NO_ROOM_OPTION: SelectOption = { value: "", label: "No room assigned" };

/**
 * The Maintenance task form's field markup - shared between the create
 * form and the edit form, the same split `RoomFormFields`/
 * `InventoryItemFormFields` already establish. Matches Phase 1's own scope
 * exactly: name, description, category, room, priority, due date, notes.
 */
export function MaintenanceTaskFormFields({ roomOptions, defaultValues }: MaintenanceTaskFormFieldsProps) {
  return (
    <>
      <FormField label="Task name" required>
        <Input
          name="name"
          autoComplete="off"
          placeholder="Change HVAC filter"
          maxLength={150}
          defaultValue={defaultValues?.name}
        />
      </FormField>

      <FormField label="Description" hint="Optional.">
        <Textarea name="description" rows={2} maxLength={1000} defaultValue={defaultValues?.description ?? ""} />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Category" required>
          <Select name="category" options={MAINTENANCE_CATEGORY_OPTIONS} defaultValue={defaultValues?.category ?? "general"} />
        </FormField>
        <FormField label="Priority" required>
          <Select name="priority" options={MAINTENANCE_PRIORITY_OPTIONS} defaultValue={defaultValues?.priority ?? "medium"} />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Room" hint="Optional.">
          <Select name="roomId" options={[NO_ROOM_OPTION, ...roomOptions]} defaultValue={defaultValues?.roomId ?? ""} />
        </FormField>
        <FormField label="Due date" hint="Optional.">
          <DatePicker name="dueDate" defaultValue={defaultValues?.dueDate ?? undefined} />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Repeats" hint="Turn this into a recurring task. Optional.">
          <Select
            name="recurrenceFrequency"
            options={RECURRENCE_FREQUENCY_OPTIONS}
            defaultValue={defaultValues?.recurrenceFrequency ?? "none"}
          />
        </FormField>
        <FormField label="Custom interval (days)" hint="Only used when repeats is set to Custom.">
          <Input
            name="recurrenceIntervalDays"
            type="number"
            inputMode="numeric"
            min={1}
            max={3650}
            defaultValue={defaultValues?.recurrenceIntervalDays ?? ""}
          />
        </FormField>
      </div>

      <FormField label="Notes" hint="Anything else worth keeping in mind. Optional.">
        <Textarea name="notes" rows={3} maxLength={2000} defaultValue={defaultValues?.notes ?? ""} />
      </FormField>
    </>
  );
}
