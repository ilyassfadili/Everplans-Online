"use client";

import { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type Matcher, type NavProps } from "react-day-picker";

import { cn } from "@/lib/cn";
import { inputClassName } from "./input";

export interface DatePickerProps {
  id?: string;
  name?: string;
  /** ISO `YYYY-MM-DD`, or `""`/`null` for no date. Controlled - pair with `onValueChange`. */
  value?: string | null;
  /** ISO `YYYY-MM-DD`. Uncontrolled starting value, the same role `defaultValue` plays on `Input`. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** ISO `YYYY-MM-DD` bounds, matching `FieldDefinition`'s `min`/`max` (`@/types/planner-structure`). */
  min?: string;
  max?: string;
  placeholder?: string;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
}

/** Parses a `YYYY-MM-DD` string as a local-midnight `Date`, the same construction `formatExpenseDate` and friends already use so a date never shifts a day from timezone-aware UTC parsing. */
function parseIsoDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** The inverse of `parseIsoDate` - local calendar fields, not `toISOString()` (which is UTC and can land on the wrong day near midnight). */
function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

const navButtonClassName =
  "flex size-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 ease-standard " +
  "hover:bg-surface-muted hover:text-ink disabled:pointer-events-none disabled:opacity-40 " +
  "outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

/**
 * Overrides `react-day-picker`'s default nav (which renders as an absolutely
 * positioned sibling of the month label, styled entirely through its own
 * default stylesheet we don't load) with two plain icon buttons on the
 * Everplans ghost-button treatment.
 */
function CalendarNav({ onPreviousClick, onNextClick, previousMonth, nextMonth }: NavProps) {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex h-9 items-center justify-between px-1">
      <button type="button" onClick={onPreviousClick} disabled={!previousMonth} aria-label="Previous month" className={navButtonClassName}>
        <ChevronLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />
      </button>
      <button type="button" onClick={onNextClick} disabled={!nextMonth} aria-label="Next month" className={navButtonClassName}>
        <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
}

/*
  Every UI key below replaces (not extends) react-day-picker's own default
  class for that part - we never load its default stylesheet, so each part
  gets its full visual treatment here in one place, in Everplans' own
  tokens, rather than fighting an unloaded `.rdp-*` base style. Day state
  (selected/today/outside/disabled) is driven by `group-data-*` variants
  reading the data attributes react-day-picker already puts on the day cell
  - no custom `DayButton` component needed.
*/
const calendarClassNames = {
  months: "relative",
  month: "space-y-1",
  month_caption: "flex h-8 items-center justify-center text-body-sm font-semibold text-ink",
  month_grid: "w-full table-fixed border-collapse",
  weekday: "w-9 pb-1 text-center text-caption font-medium text-ink-faint",
  // `w-9`/`size-9` (36px) - the smallest a thumb wants to reliably hit,
  // not the largest that would still work. `size-10` read as oversized next
  // to the rest of this control (live feedback: "the calendar must not be
  // that big") once the whole popover was measured against other SaaS date
  // pickers, which mostly land in the 32-36px range for exactly this reason -
  // this is still comfortably tappable, just no longer padded past what
  // touch accuracy actually needs.
  day: "group w-9 p-0 py-0.5 text-center align-middle",
  day_button:
    "inline-flex size-9 items-center justify-center rounded-full text-body-sm font-medium text-ink " +
    "transition-colors duration-150 ease-standard outline-none hover:bg-accent-subtle " +
    "focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface " +
    "group-data-[outside]:text-ink-faint/70 " +
    "group-data-[disabled]:pointer-events-none group-data-[disabled]:text-ink-disabled group-data-[disabled]:hover:bg-transparent " +
    "group-data-[today]:font-semibold group-data-[today]:text-brand " +
    "group-data-[selected]:bg-brand group-data-[selected]:font-semibold group-data-[selected]:text-ink-on-brand group-data-[selected]:hover:bg-brand-hover",
};

/**
 * The one calendar UI for the whole site - every `<input type="date">` was a
 * native OS picker (different look on every browser/OS, unstyleable past its
 * closed-state text box, and the actual cause of the "doesn't match the rest
 * of the site" look). This renders its own Radix popover + `react-day-picker`
 * grid in Everplans' own tokens instead, the same "own the open state, not
 * just the closed trigger" move `Select` already makes for `<select>`.
 *
 * Still a real form control: when `name` is set, a hidden input carries the
 * ISO value so `formData.get(name)` in a Server Action (or the
 * `handleSave(formData)` pattern rows like `ExpenseRow` use) keeps working
 * unchanged. Unlike `Select`'s hidden `<select>`, this hidden input can't
 * carry native `required`/`min`/`max` constraint validation (a `type="hidden"`
 * input is barred from constraint validation entirely) - every one of these
 * forms already validates the date server-side (e.g. `weddings.ts`'s zod
 * schema), so this trades a native validation bubble for a popover that
 * actually looks like it belongs on this site.
 */
export function DatePicker({
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  placeholder = "Select date",
  invalid,
  required,
  disabled,
  className,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: DatePickerProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);

  const currentValue = (isControlled ? value : internalValue) ?? "";
  const selectedDate = parseIsoDate(currentValue);
  const minDate = parseIsoDate(min);
  const maxDate = parseIsoDate(max);
  const disabledMatchers: Matcher[] = [];
  if (minDate) disabledMatchers.push({ before: minDate });
  if (maxDate) disabledMatchers.push({ after: maxDate });

  // The month the grid is showing - starts wherever the current value (or
  // today) lands, but can drift from either once the visitor pages through
  // months without picking a day. Tracked separately so "Today" can jump
  // the grid back even after that drift, not just change `selected`.
  const [month, setMonth] = useState(selectedDate ?? new Date());

  function handleSelect(date: Date | undefined) {
    const iso = date ? toIsoDate(date) : "";
    if (!isControlled) setInternalValue(iso);
    onValueChange?.(iso);
    setOpen(false);
  }

  function handleToday() {
    const today = new Date();
    setMonth(today);
    handleSelect(today);
  }

  function handleClear() {
    handleSelect(undefined);
  }

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Re-center on whatever's actually selected each time it opens, so
        // paging away from the value in one visit doesn't strand the next
        // visit's first paint on a stale month.
        if (next) setMonth(selectedDate ?? new Date());
      }}
    >
      {name && <input type="hidden" name={name} value={currentValue} />}
      <PopoverPrimitive.Trigger
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid ?? invalid}
        aria-describedby={ariaDescribedBy}
        aria-required={required}
        className={inputClassName(invalid, cn("flex items-center justify-between gap-2 text-left", className))}
      >
        <span className={selectedDate ? "text-ink" : "text-ink-faint"}>
          {selectedDate ? dateFormatter.format(selectedDate) : placeholder}
        </span>
        <CalendarDays className="size-4 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden="true" />
      </PopoverPrimitive.Trigger>

      {/* Radix's Popper positioning (not something bolted on top of it) is
          what actually answers "open in the best place for each device":
          `avoidCollisions` (on by default) flips the side and shifts the
          align whenever the default placement would run off the visible
          viewport - the exact "opens above the field when there's no room
          below" behavior already visible near the bottom of a short screen.
          A smaller popover just gives that logic more room to work with,
          so it needs to flip/shift less often in the first place. */}
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className={cn(
            "z-50 w-[18rem] max-w-[calc(100vw-1.5rem)] rounded-lg border border-line-subtle bg-surface p-2.5 text-ink shadow-xl",
            "animate-accordion-reveal will-change-transform",
          )}
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            month={month}
            onMonthChange={setMonth}
            disabled={disabledMatchers.length ? disabledMatchers : undefined}
            showOutsideDays
            weekStartsOn={0}
            classNames={calendarClassNames}
            components={{ Nav: CalendarNav }}
          />

          <div className="mt-0.5 flex items-center justify-between border-t border-line-subtle pt-1.5">
            <button
              type="button"
              onClick={handleClear}
              disabled={!selectedDate}
              className="rounded-sm text-body-sm font-medium text-ink-muted transition-colors duration-150 ease-standard hover:text-ink disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="rounded-sm text-body-sm font-medium text-brand transition-colors duration-150 ease-standard hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              Today
            </button>
          </div>

          <PopoverPrimitive.Arrow className="fill-surface stroke-line-subtle" strokeWidth={1} width={12} height={6} />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
