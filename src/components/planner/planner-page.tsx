import { Eyebrow, Heading } from "@/components/ui";
import type { PageValidationResult, PlannerFieldValues } from "@/types/planner-runtime";
import type { PlannerPage as PlannerPageDefinition } from "@/types/planner-structure";

import { GenericField } from "./generic-field";

interface PlannerPageProps {
  sectionTitle: string;
  page: PlannerPageDefinition;
  values: PlannerFieldValues;
  validation: PageValidationResult;
  showValidation: boolean;
  onFieldChange: (fieldId: string, value: string | number | boolean | null) => void;
}

/**
 * Renders one `PlannerPage` - the "Section / Page" layer of PROMPT 5's
 * rendering diagram, one step below the runtime that decides *which*
 * page is current. Purely a mapping from `page.fields` to `GenericField`
 * instances; no field-specific logic lives here, and none should - a
 * page with a different set of generic field types renders through this
 * exact same component unchanged.
 */
export function PlannerPage({ sectionTitle, page, values, validation, showValidation, onFieldChange }: PlannerPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Eyebrow tone="muted">{sectionTitle}</Eyebrow>
        <Heading as="h1" size="h3" className="mt-1.5">
          {page.title}
        </Heading>
      </div>

      <div className="flex flex-col gap-5">
        {page.fields.map((field) => (
          <GenericField
            key={field.id}
            field={field}
            value={values[field.id] ?? null}
            onChange={(value) => onFieldChange(field.id, value)}
            validation={validation.fieldResults[field.id] ?? { status: "valid" }}
            showValidation={showValidation}
          />
        ))}
      </div>
    </div>
  );
}
