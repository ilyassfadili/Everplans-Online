import { DatePicker, FormField, Select, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { RECURRENCE_FREQUENCY_OPTIONS } from "@/lib/home-planner/recurrence";

import { BILL_CATEGORY_OPTIONS } from "./bill-category-options";

interface BillFormFieldsProps {
  defaultValues?: {
    name?: string;
    category?: string;
    amountDollars?: string;
    dueDate?: string | null;
    notes?: string | null;
    recurrenceFrequency?: string | null;
    recurrenceIntervalDays?: number | null;
  };
}

/**
 * The Bill form's field markup - shared between the create form and the
 * edit form, the same split every other Home Planner entity form
 * establishes. Matches Phase 1's own scope: name, category, amount, due
 * date, notes, and recurrence (Phase 1: "identify recurring bills," reusing
 * the same recurrence controls `MaintenanceTaskFormFields` already
 * establishes).
 */
export function BillFormFields({ defaultValues }: BillFormFieldsProps) {
  return (
    <>
      <FormField label="Bill name" required>
        <Input name="name" autoComplete="off" placeholder="Electric bill" maxLength={150} defaultValue={defaultValues?.name} />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Category" required>
          <Select name="category" options={BILL_CATEGORY_OPTIONS} defaultValue={defaultValues?.category ?? "other"} />
        </FormField>
        <FormField label="Amount" required hint="In dollars.">
          <Input name="amountDollars" inputMode="decimal" placeholder="0.00" defaultValue={defaultValues?.amountDollars ?? ""} />
        </FormField>
      </div>

      <FormField label="Due date" hint="Optional.">
        <DatePicker name="dueDate" defaultValue={defaultValues?.dueDate ?? undefined} />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Repeats" hint="How often this bill recurs.">
          <Select
            name="recurrenceFrequency"
            options={RECURRENCE_FREQUENCY_OPTIONS}
            defaultValue={defaultValues?.recurrenceFrequency ?? "monthly"}
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
