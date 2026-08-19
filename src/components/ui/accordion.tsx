import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/*
  Built on native <details>/<summary> rather than a custom ARIA widget -
  the browser already provides correct toggle semantics, keyboard support
  (Enter/Space on the focused summary), and accessibility-tree exposure
  with no JS and no ARIA authored by hand. Sharing one `name` across items
  uses the browser's own "only one open at a time" behavior instead of
  reimplementing it in React state.
*/

interface AccordionProps {
  children: ReactNode;
  className?: string;
}

export function Accordion({ children, className }: AccordionProps) {
  return (
    <div className={cn("flex flex-col divide-y divide-line-subtle border-y border-line-subtle", className)}>
      {children}
    </div>
  );
}

interface AccordionItemProps {
  /** Shared across items in the same Accordion so opening one closes the rest. */
  name: string;
  question: string;
  children: ReactNode;
  /** Renders open on first paint - use for the item most users want to see first. */
  defaultOpen?: boolean;
}

export function AccordionItem({ name, question, children, defaultOpen }: AccordionItemProps) {
  return (
    <details name={name} open={defaultOpen} className="group py-5">
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-4",
          "text-body-lg font-medium text-ink marker:content-none [&::-webkit-details-marker]:hidden",
        )}
      >
        {question}
        <ChevronDown
          className="size-5 shrink-0 text-ink-faint transition-transform duration-200 ease-standard group-open:rotate-180"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </summary>
      <div className="animate-accordion-reveal pt-3 text-body text-ink-muted">{children}</div>
    </details>
  );
}
