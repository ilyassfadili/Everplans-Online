"use client";

import { cn } from "@/lib/cn";

import { DAY_OPTIONS } from "./routine-visuals";

interface ActiveDaysPickerProps {
  value: number[];
  onChange: (days: number[]) => void;
  /** The form field name each selected day is submitted under - `formData.getAll(name)` on the receiving Server Action reads every selected day back out. */
  name?: string;
}

/**
 * A row of 7 toggleable day chips (Phase 2 §4's own "simple row of 7
 * toggleable day chips is enough, no calendar widget" instruction) - the
 * `"weekly"`/`"custom"` frequency's own day picker, shared by both the "New
 * routine" form and the routine detail page's own edit form. Deliberately
 * not routed through `FormField`/a real `<select multiple>` - a checkbox
 * group of exactly 7 fixed, always-visible options reads better as chips
 * than as a dropdown, the same reasoning `GoalMilestones`' status-cycle
 * button favors a direct click over a `<Select>` for a small fixed set.
 *
 * Submits via one hidden `<input type="hidden">` per selected day (all
 * sharing `name`) rather than a single serialized value, so a plain native
 * `<form action={formAction}>` Server Action can read the selection back
 * with `formData.getAll(name)` - no client-side JSON encoding needed on
 * either side.
 */
export function ActiveDaysPicker({ value, onChange, name = "activeDays" }: ActiveDaysPickerProps) {
  function toggle(day: number) {
    onChange(value.includes(day) ? value.filter((selected) => selected !== day) : [...value, day].sort((a, b) => a - b));
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {value.map((day) => (
        <input key={day} type="hidden" name={name} value={day} />
      ))}
      {DAY_OPTIONS.map((day) => {
        const selected = value.includes(day.value);
        return (
          <button
            key={day.value}
            type="button"
            onClick={() => toggle(day.value)}
            aria-pressed={selected}
            className={cn(
              "rounded-full border px-3 py-1.5 text-body-sm font-medium transition-colors duration-150 ease-standard",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
              selected ? "border-brand bg-brand text-ink-on-brand" : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
}
