"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/cn";
import type { WeddingTaskPriority } from "@/types/wedding";

const PRIORITY_OPTIONS: WeddingTaskPriority[] = ["high", "medium", "low"];

const PRIORITY_LABEL: Record<WeddingTaskPriority, string> = {
  low: "Low priority",
  medium: "Medium priority",
  high: "High priority",
};

// One color per priority, using the same semantic status tokens every other
// colored state in the app already draws from (`text-error`/`bg-error-subtle`,
// etc. - `@/styles/globals.css`) rather than one-off hex values: high reads as
// urgent (red), medium as a caution/heads-up (amber, the closest token to
// "yellow" this design system defines), low as settled/on-track (green) - the
// same red/amber/green convention a priority control is expected to use.
// Background/border both carry an opacity modifier (`/50`, `/25`) rather than
// the token's own full-strength value - a soft, translucent tint reads as
// calmer and more premium than a flat, fully opaque fill; the label text
// itself stays at full opacity so it's never harder to read.
const PRIORITY_CHIP_CLASS: Record<WeddingTaskPriority, string> = {
  high: "border-error/25 bg-error-subtle/50 text-error",
  medium: "border-warning/25 bg-warning-subtle/50 text-warning",
  low: "border-success/25 bg-success-subtle/50 text-success",
};

interface PrioritySelectProps {
  id?: string;
  name?: string;
  defaultValue?: WeddingTaskPriority;
  value?: WeddingTaskPriority;
  onValueChange?: (value: WeddingTaskPriority) => void;
  "aria-label"?: string;
  className?: string;
}

/**
 * A `Select` for exactly the three task priorities. The trigger itself is
 * tinted to the selected priority's color (not a plain white input) - the
 * same soft red/amber/green chip the open list uses, so the closed control
 * already communicates the choice at a glance instead of requiring the
 * label to be read. High/medium/low map to red/amber/green
 * (`PRIORITY_CHIP_CLASS`), the universal priority convention - this
 * deliberately supersedes an earlier, more muted treatment (`PriorityBadge`'s
 * own comment still explains that reasoning) on explicit product direction
 * that priority should read as a clear, colored signal here, in the control
 * that sets it.
 *
 * `overflow-hidden` + `truncate` on every text-bearing layer (trigger and
 * each item alike) is deliberately redundant, not decorative - a select
 * this narrow, with a label and a chevron sharing one row, has no slack for
 * the label to wrap without visibly breaking the control's fixed height
 * (a bug this replaced) or crowding the chevron out of the row entirely.
 *
 * The generic `Select` primitive (`@/components/ui/form/select`) only
 * renders plain-text options, so priority's own color coding lives here,
 * next to `PriorityBadge` (the same domain), rather than teaching every
 * `Select` consumer about colored options it doesn't need.
 *
 * Tracks the selected value itself (seeded from `value`/`defaultValue`)
 * rather than relying on Radix's default trigger behavior (mirroring the
 * selected item's `ItemText` verbatim) - knowing the current value directly
 * is what lets the trigger render its own single colored chip instead of
 * nesting one inside a second, differently-styled box.
 */
export function PrioritySelect({
  id,
  name,
  defaultValue,
  value,
  onValueChange,
  className,
  "aria-label": ariaLabel,
}: PrioritySelectProps) {
  const [internalValue, setInternalValue] = useState<WeddingTaskPriority>(defaultValue ?? value ?? "medium");
  const current = value ?? internalValue;

  function handleValueChange(next: string) {
    const priority = next as WeddingTaskPriority;
    setInternalValue(priority);
    onValueChange?.(priority);
  }

  return (
    <SelectPrimitive.Root
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={handleValueChange}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          "flex h-11 w-full min-w-0 items-center justify-between gap-2 overflow-hidden rounded-md border px-3.5 text-body-sm font-semibold",
          "transition-colors duration-150 ease-standard",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus-ring/15",
          PRIORITY_CHIP_CLASS[current],
          className,
        )}
      >
        {/* No `SelectPrimitive.Value` here - Radix's accessibility comes
            from the Trigger's own ARIA attributes, not from rendering
            `Value` specifically, and `Value` painted its own (visible)
            copy of the label alongside this one even with `sr-only`
            applied, producing the exact "High priority High priority"
            duplicate this replaced. This span is the only copy of the
            label in the tree. */}
        <span className="min-w-0 flex-1 truncate whitespace-nowrap">{PRIORITY_LABEL[current]}</span>
        <SelectPrimitive.Icon className="shrink-0">
          <ChevronDown className="size-4" strokeWidth={2.25} aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-line-subtle bg-surface p-1.5 text-ink shadow-lg"
        >
          <SelectPrimitive.Viewport className="flex flex-col gap-1.5">
            {PRIORITY_OPTIONS.map((priority) => (
              <SelectPrimitive.Item
                key={priority}
                value={priority}
                className={cn(
                  "relative flex cursor-pointer select-none items-center overflow-hidden rounded-md border px-3.5 py-2.5 text-body-sm font-semibold outline-none",
                  "transition-colors duration-150 ease-standard",
                  PRIORITY_CHIP_CLASS[priority],
                  "data-[highlighted]:brightness-[0.97]",
                  "data-[state=checked]:ring-2 data-[state=checked]:ring-current/30 data-[state=checked]:ring-offset-1 data-[state=checked]:ring-offset-surface",
                )}
              >
                <SelectPrimitive.ItemText>
                  <span className="truncate whitespace-nowrap">{PRIORITY_LABEL[priority]}</span>
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="ml-auto flex shrink-0 items-center">
                  <Check className="size-4" strokeWidth={2.25} aria-hidden="true" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
