import { DatePicker, FormField, Select, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import type { Trip } from "@/types/travel";

import { TRIP_TYPE_OPTIONS } from "./trip-type-options";

interface TripFormFieldsProps {
  defaultValues?: Pick<Trip, "destination" | "startDate" | "endDate" | "travelerCount" | "tripType" | "tripGoals" | "notes">;
}

/**
 * The Trip Setup form's field markup - shared between the onboarding form
 * (create) and the edit form (update) so the two screens can never drift
 * apart on labels, hints, or field order. Only the two callers' `<form>`
 * wrapper (submit action, surrounding copy, success/error banners) differs;
 * everything about what a trip actually asks for lives here once.
 *
 * Deliberately six fields, matching Prompt 1 Phase 3's own scope exactly:
 * destination, dates, travelers, trip type, goals, notes - nothing from
 * itinerary/budget/bookings, which don't exist yet.
 */
export function TripFormFields({ defaultValues }: TripFormFieldsProps) {
  return (
    <>
      <FormField label="Destination" required>
        <Input
          name="destination"
          autoComplete="off"
          placeholder="Lisbon, Portugal"
          maxLength={200}
          defaultValue={defaultValues?.destination}
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Start date" required>
          <DatePicker name="startDate" defaultValue={defaultValues?.startDate} />
        </FormField>
        <FormField label="End date" required>
          <DatePicker name="endDate" defaultValue={defaultValues?.endDate} />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Travelers" required hint="How many people are going.">
          <Input
            name="travelerCount"
            type="number"
            inputMode="numeric"
            min={1}
            max={50}
            defaultValue={defaultValues?.travelerCount ?? 1}
          />
        </FormField>
        <FormField label="Trip type" required>
          <Select name="tripType" options={TRIP_TYPE_OPTIONS} defaultValue={defaultValues?.tripType ?? "vacation"} />
        </FormField>
      </div>

      <FormField label="Trip goals" hint="What do you want out of this trip? Optional.">
        <Textarea
          name="tripGoals"
          rows={3}
          maxLength={500}
          placeholder="Relax on the coast, try the local food, see the old town..."
          defaultValue={defaultValues?.tripGoals ?? ""}
        />
      </FormField>

      <FormField label="Notes" hint="Anything else worth keeping in mind. Optional.">
        <Textarea
          name="notes"
          rows={4}
          maxLength={2000}
          placeholder="Flight lands late, so keep the first day light..."
          defaultValue={defaultValues?.notes ?? ""}
        />
      </FormField>
    </>
  );
}
