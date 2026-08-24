import { FormField, Select, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import type { Room } from "@/types/home-planner";

import { ROOM_TYPE_OPTIONS } from "./room-type-options";

interface RoomFormFieldsProps {
  defaultValues?: Pick<Room, "name" | "roomType" | "description" | "notes">;
}

/**
 * The Room form's field markup - shared between the create form and the
 * edit form so the two screens can never drift apart on labels, hints, or
 * field order, the same split `HomeFormFields` already establishes.
 * Deliberately four fields, matching Phase 1's own scope exactly: name,
 * type, optional description, optional notes - nothing from inventory/
 * maintenance, which don't exist yet.
 */
export function RoomFormFields({ defaultValues }: RoomFormFieldsProps) {
  return (
    <>
      <FormField label="Room name" required>
        <Input
          name="name"
          autoComplete="off"
          placeholder="Primary Bedroom"
          maxLength={150}
          defaultValue={defaultValues?.name}
        />
      </FormField>

      <FormField label="Room type" required>
        <Select name="roomType" options={ROOM_TYPE_OPTIONS} defaultValue={defaultValues?.roomType ?? "other"} />
      </FormField>

      <FormField label="Description" hint="A short description of this room. Optional.">
        <Textarea
          name="description"
          rows={2}
          maxLength={500}
          placeholder="Main bedroom with an en-suite bathroom"
          defaultValue={defaultValues?.description ?? ""}
        />
      </FormField>

      <FormField label="Notes" hint="Anything else worth keeping in mind about this room. Optional.">
        <Textarea
          name="notes"
          rows={4}
          maxLength={2000}
          placeholder="Paint color, flooring, renovation plans..."
          defaultValue={defaultValues?.notes ?? ""}
        />
      </FormField>
    </>
  );
}
