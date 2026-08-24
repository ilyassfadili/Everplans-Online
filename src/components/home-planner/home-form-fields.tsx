import { FormField, Select, Textarea } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import type { Home } from "@/types/home-planner";

import { HOME_TYPE_OPTIONS } from "./home-type-options";
import { OWNERSHIP_STATUS_OPTIONS } from "./ownership-status-options";

interface HomeFormFieldsProps {
  defaultValues?: Pick<
    Home,
    | "name"
    | "homeType"
    | "ownershipStatus"
    | "addressLine1"
    | "addressLine2"
    | "city"
    | "state"
    | "postalCode"
    | "country"
    | "notes"
  >;
}

/**
 * The Home Profile form's field markup - shared between the setup form
 * (create) and the edit form (update) so the two screens can never drift
 * apart on labels, hints, or field order. Only the two callers' `<form>`
 * wrapper (submit action, surrounding copy, success/error banners) differs;
 * everything about what a home profile actually asks for lives here once -
 * the same split `TripFormFields` (`@/components/travel/trip-form-fields`)
 * already establishes.
 *
 * Matches Phase 2's own scope exactly: name, type, ownership status,
 * address, and optional additional details - nothing from rooms/inventory/
 * maintenance, which don't exist yet.
 */
export function HomeFormFields({ defaultValues }: HomeFormFieldsProps) {
  return (
    <>
      <FormField label="Home name" required>
        <Input
          name="name"
          autoComplete="off"
          placeholder="Our house"
          maxLength={150}
          defaultValue={defaultValues?.name}
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Home type" required>
          <Select name="homeType" options={HOME_TYPE_OPTIONS} defaultValue={defaultValues?.homeType ?? "house"} />
        </FormField>
        <FormField label="Ownership status" required>
          <Select
            name="ownershipStatus"
            options={OWNERSHIP_STATUS_OPTIONS}
            defaultValue={defaultValues?.ownershipStatus ?? "own"}
          />
        </FormField>
      </div>

      <FormField label="Address line 1" hint="Street address. Optional.">
        <Input name="addressLine1" autoComplete="off" maxLength={200} defaultValue={defaultValues?.addressLine1 ?? ""} />
      </FormField>

      <FormField label="Address line 2" hint="Apartment, suite, unit, etc. Optional.">
        <Input name="addressLine2" autoComplete="off" maxLength={200} defaultValue={defaultValues?.addressLine2 ?? ""} />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-3">
        <FormField label="City" className="sm:col-span-1">
          <Input name="city" autoComplete="off" maxLength={100} defaultValue={defaultValues?.city ?? ""} />
        </FormField>
        <FormField label="State / Province">
          <Input name="state" autoComplete="off" maxLength={100} defaultValue={defaultValues?.state ?? ""} />
        </FormField>
        <FormField label="Postal code">
          <Input name="postalCode" autoComplete="off" maxLength={20} defaultValue={defaultValues?.postalCode ?? ""} />
        </FormField>
      </div>

      <FormField label="Country" hint="Optional.">
        <Input name="country" autoComplete="off" maxLength={100} defaultValue={defaultValues?.country ?? ""} />
      </FormField>

      <FormField label="Additional details" hint="Anything else worth keeping in mind about this home. Optional.">
        <Textarea
          name="notes"
          rows={4}
          maxLength={2000}
          placeholder="Gate code, HOA info, move-in date..."
          defaultValue={defaultValues?.notes ?? ""}
        />
      </FormField>
    </>
  );
}
