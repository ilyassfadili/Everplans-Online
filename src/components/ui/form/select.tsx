"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";
import { inputClassName } from "./input";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Shown while nothing is selected. Omit when `value`/`defaultValue` always points at a real option. */
  placeholder?: string;
  options: readonly SelectOption[];
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
}

/*
  A real <select> only lets CSS reach its closed trigger - the open option
  list is rendered by the browser/OS and can't be restyled (font, padding,
  hover color) to match the rest of the design system. Radix's Select is an
  unstyled, fully accessible primitive (keyboard nav, focus management,
  listbox ARIA roles) that renders its own popover instead, so every part of
  the control - trigger and open list alike - can carry Everplans' own
  tokens. Radix still renders a native hidden <select> under the hood when
  `name` is set, so `formData.get("reason")` in the Server Action keeps
  working unchanged.
*/
export function Select({
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  options,
  invalid,
  required,
  disabled,
  className,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: SelectProps) {
  return (
    <SelectPrimitive.Root
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      required={required}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        className={inputClassName(invalid, cn("flex items-center justify-between gap-2 text-left", className))}
      >
        <SelectPrimitive.Value placeholder={placeholder} className="text-ink data-[placeholder]:text-ink-faint" />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-line-subtle bg-surface text-ink shadow-lg"
        >
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm py-2.5 pl-3.5 pr-9 text-body-sm outline-none",
                  "data-[highlighted]:bg-accent-subtle data-[highlighted]:text-brand",
                  "data-[state=checked]:font-medium data-[state=checked]:text-brand",
                )}
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-3 flex items-center">
                  <Check className="size-4" strokeWidth={1.75} aria-hidden="true" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
