/**
 * The curated event-type list (Prompt 5 Phase 1's own examples) - shown as
 * `Select` options, but `wedding_events.event_type` itself stays a plain
 * text column (not a database enum or separate table per kind - Phase 1:
 * "do not hardcode these as separate technical systems").
 */
export const EVENT_TYPE_OPTIONS = [
  { value: "Ceremony", label: "Ceremony" },
  { value: "Reception", label: "Reception" },
  { value: "Rehearsal", label: "Rehearsal" },
  { value: "Welcome Event", label: "Welcome Event" },
  { value: "Other", label: "Other" },
];
