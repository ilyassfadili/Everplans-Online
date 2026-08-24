import { Check, X } from "lucide-react";

import { Container, Heading, Reveal, Section, Text } from "@/components/ui";
import type { ProductLandingConfig } from "@/types/product-landing";

/**
 * A plain two-panel "without / with" comparison rather than an abstract
 * illustration - the brief asks this section to be legible at a glance, and
 * a direct before/after reads faster than a metaphor here. Kept to one
 * sentence each; no fear-based language, just what changes.
 */
export function ProductProblemSolution({ config }: { config: ProductLandingConfig }) {
  return (
    <Section background="canvas">
      <Container size="narrow">
        <Reveal className="text-center">
          <Heading as="h2" className="text-balance">
            {config.problem.heading}
          </Heading>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {/*
            Red/green isn't a fourth hue on top of the three-color system -
            it's the site's own status tokens (`text-error`/`bg-error-subtle`,
            `text-success`/`bg-success-subtle`, already used for form
            validation elsewhere) borrowed for the one place a before/after
            comparison genuinely wants that instant, wordless "bad/good"
            read. Kept to a thin tinted ring + an icon badge, not a filled
            colored card - the color marks which side is which without
            turning the section into two blocks of paint.
          */}
          <Reveal
            delay={70}
            className="rounded-xl border border-error/15 bg-gradient-to-br from-error-subtle/60 to-surface p-6"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-error-subtle text-error ring-1 ring-error/20">
                <X className="size-4" strokeWidth={2} aria-hidden="true" />
              </span>
              <Text weight="semibold">Without Everplans</Text>
            </div>
            <Text tone="muted" className="mt-3">
              {config.problem.withoutBody}
            </Text>
          </Reveal>

          <Reveal
            delay={140}
            className="rounded-xl border border-success/15 bg-gradient-to-br from-success-subtle/60 to-surface p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success-subtle text-success ring-1 ring-success/20">
                <Check className="size-4" strokeWidth={2} aria-hidden="true" />
              </span>
              <Text weight="semibold">With Everplans</Text>
            </div>
            <Text tone="muted" className="mt-3">
              {config.problem.withBody}
            </Text>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
