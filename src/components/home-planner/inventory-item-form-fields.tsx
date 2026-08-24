import { DatePicker, FormField, Select, Textarea } from "@/components/ui";
import type { SelectOption } from "@/components/ui/form/select";
import { Input } from "@/components/ui/form/input";

import { INVENTORY_CATEGORY_OPTIONS } from "./inventory-category-options";

interface InventoryItemFormFieldsProps {
  roomOptions: SelectOption[];
  defaultValues?: {
    name?: string;
    category?: string;
    roomId?: string | null;
    quantity?: number;
    purchaseDate?: string | null;
    purchaseInfo?: string | null;
    estimatedValueDollars?: string;
    notes?: string | null;
  };
}

const NO_ROOM_OPTION: SelectOption = { value: "", label: "No room assigned" };

/**
 * The Inventory item form's field markup - shared between the create form
 * and the edit form, the same split `RoomFormFields`/`HomeFormFields`
 * already establish. Deliberately matches Phase 2's own scope exactly:
 * name, category, room, quantity, purchase date, purchase info, estimated
 * value, notes - "do not overcomplicate the data model."
 */
export function InventoryItemFormFields({ roomOptions, defaultValues }: InventoryItemFormFieldsProps) {
  return (
    <>
      <FormField label="Item name" required>
        <Input name="name" autoComplete="off" placeholder="Sofa" maxLength={150} defaultValue={defaultValues?.name} />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Category" required>
          <Select name="category" options={INVENTORY_CATEGORY_OPTIONS} defaultValue={defaultValues?.category ?? "other"} />
        </FormField>
        <FormField label="Room" hint="Where this item lives. Optional.">
          <Select name="roomId" options={[NO_ROOM_OPTION, ...roomOptions]} defaultValue={defaultValues?.roomId ?? ""} />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Quantity" required>
          <Input name="quantity" type="number" inputMode="numeric" min={1} max={10000} defaultValue={defaultValues?.quantity ?? 1} />
        </FormField>
        <FormField label="Estimated value" hint="In dollars. Optional.">
          <Input
            name="estimatedValueDollars"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={defaultValues?.estimatedValueDollars ?? ""}
          />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Purchase date" hint="Optional.">
          <DatePicker name="purchaseDate" defaultValue={defaultValues?.purchaseDate ?? undefined} />
        </FormField>
        <FormField label="Purchase info" hint="Retailer, order number, etc. Optional.">
          <Input name="purchaseInfo" maxLength={500} defaultValue={defaultValues?.purchaseInfo ?? ""} />
        </FormField>
      </div>

      <FormField label="Notes" hint="Anything else worth keeping in mind. Optional.">
        <Textarea name="notes" rows={3} maxLength={2000} defaultValue={defaultValues?.notes ?? ""} />
      </FormField>
    </>
  );
}
