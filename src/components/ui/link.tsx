import { cva, type VariantProps } from "class-variance-authority";
import NextLink from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/*
  Everplans link treatment - separate from Button on purpose. A link that
  looks like a button competes with the page's real CTAs; a button that's
  actually a plain anchor undersells the action it performs. This component
  covers the "it's just a link" cases: inline prose links, nav items,
  a stronger in-content link, and a quiet utility link.
*/

const linkVariants = cva("transition-colors duration-150 ease-standard", {
  variants: {
    variant: {
      // Inside a paragraph - underlined so it doesn't rely on color alone.
      inline: "text-brand underline underline-offset-4 decoration-1 hover:text-brand-hover",
      // Site navigation - no underline at rest; current page marked via aria-current.
      nav: "text-ink-muted hover:text-ink aria-[current=page]:text-ink aria-[current=page]:font-medium",
      // A link that should read with more visual weight than inline prose.
      prominent: "text-ink font-medium underline underline-offset-4 decoration-line-strong hover:decoration-ink",
      // Low-emphasis utility link (footer legal, "skip this step").
      subtle: "text-ink-faint hover:text-ink-muted",
    },
  },
  defaultVariants: {
    variant: "inline",
  },
});

type LinkVariants = VariantProps<typeof linkVariants>;

export interface LinkProps extends ComponentProps<typeof NextLink>, LinkVariants {}

export function Link({ variant, className, ...props }: LinkProps) {
  return <NextLink className={cn(linkVariants({ variant }), className)} {...props} />;
}
