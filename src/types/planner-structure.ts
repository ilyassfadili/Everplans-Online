import { z } from "zod";

/**
 * The generic structural schema a planner engine renders - "planner
 * section / page / field" from PROMPT 5's own diagram, made concrete.
 * Distinct from `@/types/planner-definition`'s `PlannerDefinition`: that
 * type is the catalog/discovery shell (title, description, category,
 * status) a listing page reads; this is the actual interactive content a
 * runtime walks through once a customer opens a planner. A
 * `PlannerDefinition` describes a product exists and what it's called; a
 * `PlannerStructure` (referenced by the same `plannerId` + `schemaVersion`
 * pair `PlannerDefinition.schemaVersion` already tracks) is what that
 * product actually contains. Kept as two separate types rather than one
 * merged shape so a discovery listing never has to load an entire
 * planner's structure just to render a catalog card.
 *
 * Built with `zod` schemas (not hand-written `interface`s) so this type
 * is self-validating, not just self-describing: `plannerStructureSchema
 * .safeParse(raw)` is the real defense against a malformed/corrupt
 * planner structure (PROMPT 5 Phase 1 §9's "invalid planner definition,"
 * "malformed configuration") once a real source (a JSONB column, a CMS)
 * can produce one - discriminated unions catch an unknown field `type` at
 * parse time, not just at compile time against literal TypeScript code
 * that could never disagree with itself. The same library the rest of
 * this codebase already uses for input validation (see `@/lib/profile`,
 * every `(auth)` route's `schema.ts`), not a second validation approach.
 */

const fieldBase = z.object({
  /** Unique within its page - see `plannerPageSchema`'s refinement. Also the key `PlannerFieldValues` (@/types/planner-runtime) stores this field's value under. */
  id: z.string().min(1),
  label: z.string().min(1),
  helpText: z.string().min(1).optional(),
  required: z.boolean().optional(),
});

/**
 * The initial generic field-type set PROMPT 5 Phase 1 §4 asks for -
 * text/textarea/number/date/boolean/select, and nothing more. No
 * planner-specific field ever belongs here (a "guest count" or "flight
 * number" field is a `number`/`text` field with a planner-specific
 * `label`, defined inside a future planner's own structure - never a new
 * variant of this union).
 */
const textFieldSchema = fieldBase.extend({
  type: z.literal("text"),
  maxLength: z.number().int().positive().optional(),
});

const textareaFieldSchema = fieldBase.extend({
  type: z.literal("textarea"),
  maxLength: z.number().int().positive().optional(),
});

const numberFieldSchema = fieldBase.extend({
  type: z.literal("number"),
  min: z.number().optional(),
  max: z.number().optional(),
});

const dateFieldSchema = fieldBase.extend({
  type: z.literal("date"),
  /** ISO date strings (`YYYY-MM-DD`), matching what an `<input type="date">` control produces natively. */
  min: z.iso.date().optional(),
  max: z.iso.date().optional(),
});

const booleanFieldSchema = fieldBase.extend({
  type: z.literal("boolean"),
});

const selectFieldSchema = fieldBase.extend({
  type: z.literal("select"),
  options: z
    .array(z.object({ value: z.string().min(1), label: z.string().min(1) }))
    .min(1, "A select field needs at least one option."),
});

export const fieldDefinitionSchema = z.discriminatedUnion("type", [
  textFieldSchema,
  textareaFieldSchema,
  numberFieldSchema,
  dateFieldSchema,
  booleanFieldSchema,
  selectFieldSchema,
]);

/** One interactive input, of a known, generic type - see `fieldDefinitionSchema` for why this is a discriminated union rather than one loosely-typed shape. */
export type FieldDefinition = z.infer<typeof fieldDefinitionSchema>;
export type FieldType = FieldDefinition["type"];

export const plannerPageSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    fields: z.array(fieldDefinitionSchema).min(1, "A page needs at least one field."),
  })
  .refine((page) => new Set(page.fields.map((field) => field.id)).size === page.fields.length, {
    error: "Field ids must be unique within a page.",
  });

/** One navigable step - the unit navigation/progress ("current step," "total steps") is measured in. */
export type PlannerPage = z.infer<typeof plannerPageSchema>;

export const plannerSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  pages: z.array(plannerPageSchema).min(1, "A section needs at least one page."),
});

/** A named group of pages - purely organizational (progress/navigation still operate over the flattened page list, see `@/lib/planner-runtime`). */
export type PlannerSection = z.infer<typeof plannerSectionSchema>;

export const plannerStructureSchema = z
  .object({
    plannerId: z.string().min(1),
    /** Must match the `PlannerDefinition` it belongs to - see this file's own top comment. */
    schemaVersion: z.number().int().positive(),
    sections: z.array(plannerSectionSchema).min(1, "A planner needs at least one section."),
  })
  .refine(
    (structure) => {
      const pageIds = structure.sections.flatMap((section) => section.pages.map((page) => page.id));
      return new Set(pageIds).size === pageIds.length;
    },
    { error: "Page ids must be unique across the whole planner - navigation resolves a page by id alone." },
  );

/** The full generic structure a runtime walks through for one planner, at one schema version. */
export type PlannerStructure = z.infer<typeof plannerStructureSchema>;
