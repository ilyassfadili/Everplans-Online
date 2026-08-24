"use client";

import { useId } from "react";

import { Checkbox, DatePicker, FormField, Label, Select } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import type { FieldValidationResult } from "@/types/planner-runtime";
import type { FieldDefinition } from "@/types/planner-structure";

interface GenericFieldProps {
  field: FieldDefinition;
  value: string | number | boolean | null;
  onChange: (value: string | number | boolean | null) => void;
  /** Only rendered once the runtime has actually attempted to advance past this field's page - see `PlannerRuntimeState.attemptedAdvance`'s own comment. */
  validation: FieldValidationResult;
  showValidation: boolean;
}

/**
 * The "generic UI field" at the bottom of PROMPT 5's own rendering
 * diagram (Planner Definition → Runtime → Section/Page → Field
 * Definition → Generic UI Field) - the one place a `FieldDefinition`'s
 * `type` decides which existing Everplans form control renders. No
 * planner-specific branch exists or ever should: every case here maps a
 * generic field *type*, never a specific field by name.
 *
 * `"use client"`: needs interactivity (`onChange`) - the smallest client
 * boundary this requires, one field at a time, not the whole runtime.
 * Every underlying control (`Input`, `Textarea`, `Select`, `Checkbox`) is
 * the same shared primitive the rest of the site already uses - no new
 * form-control system for planners specifically.
 */
export function GenericField({ field, value, onChange, validation, showValidation }: GenericFieldProps) {
  const error = showValidation && validation.status !== "valid" ? validation.message : undefined;
  const checkboxId = useId();

  if (field.type === "boolean") {
    const helpId = field.helpText ? `${checkboxId}-help` : undefined;
    const errorId = error ? `${checkboxId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {/* A single <label htmlFor>/<input id> pairing, not a wrapping
            native <label> around the `Label` component - `Label` already
            renders its own <label>, and nesting one inside another is
            invalid HTML (and, in some browsers, double-fires the toggle
            on click). `id`/`htmlFor` is the correct native pairing for
            "control and label are two separate elements," the same
            approach `FormField` uses for every other control. */}
        <div className="flex items-center gap-3">
          <Checkbox
            id={checkboxId}
            checked={value === true}
            onChange={(event) => onChange(event.target.checked)}
            invalid={Boolean(error)}
            aria-describedby={helpId ?? errorId}
          />
          <Label htmlFor={checkboxId} required={field.required} className="cursor-pointer">
            {field.label}
          </Label>
        </div>
        {field.helpText && !error && (
          <p id={helpId} className="text-body-sm text-ink-faint">
            {field.helpText}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-body-sm text-error">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <FormField label={field.label} hint={field.helpText} error={error} required={field.required}>
      {field.type === "text" ? (
        <Input
          type="text"
          value={typeof value === "string" ? value : ""}
          maxLength={field.maxLength}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : field.type === "textarea" ? (
        <Textarea
          value={typeof value === "string" ? value : ""}
          maxLength={field.maxLength}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : field.type === "number" ? (
        <Input
          type="number"
          value={typeof value === "number" ? value : ""}
          min={field.min}
          max={field.max}
          onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        />
      ) : field.type === "date" ? (
        <DatePicker
          value={typeof value === "string" ? value : ""}
          min={field.min}
          max={field.max}
          onValueChange={(newValue) => onChange(newValue === "" ? null : newValue)}
        />
      ) : (
        <Select
          value={typeof value === "string" ? value : undefined}
          options={field.options}
          onValueChange={(newValue) => onChange(newValue)}
        />
      )}
    </FormField>
  );
}
