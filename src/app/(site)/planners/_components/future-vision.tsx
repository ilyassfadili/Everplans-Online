import { Plus } from "lucide-react";

import { Container, Eyebrow, Heading, Section, Text } from "@/components/ui";

/**
 * An abstract "growth" chart - bars ascending toward an open, dashed "+"
 * edge, standing in for expansion over time without claiming a specific
 * number, category, or timeline (no axis labels, no values). Same idea as
 * the flat placeholder tiles this replaced, but an ascending bar-chart
 * shape is a recognizable "growing" metaphor on its own, rather than a row
 * of identical blank squares that reads as unfinished. The trailing dashed
 * tile is the only one with a symbol on it, and it isn't a promise - just
 * "more than this."
 */
function GrowthStrip() {
  const bars = [0.4, 0.52, 0.64, 0.74, 0.84, 0.92, 1];

  return (
    <div aria-hidden="true" className="flex h-36 items-end gap-3 border-b border-line-subtle sm:h-40">
      {bars.map((scale, index) => (
        <div
          key={index}
          className="w-14 shrink-0 rounded-t-lg border border-b-0 border-line-subtle bg-gradient-to-t from-accent-subtle to-accent-subtle/30 sm:w-16"
          style={{ height: `${scale * 100}%` }}
        />
      ))}
      <div className="flex h-full w-14 shrink-0 items-center justify-center rounded-t-lg border border-b-0 border-dashed border-line bg-transparent sm:w-16">
        <Plus className="size-4 text-ink-disabled" strokeWidth={1.75} />
      </div>
    </div>
  );
}

export function FutureVision() {
  return (
    <Section background="surface-muted">
      <Container size="narrow" className="text-center">
        <Eyebrow>What&rsquo;s ahead</Eyebrow>
        <Heading as="h2" className="mt-3">
          Built to grow into a full library
        </Heading>
        <Text size="body-lg" tone="muted" className="mx-auto mt-4 max-w-lg">
          Everplans is designed as a foundation for many planners across many categories - not a
          single product, but a growing collection. What&rsquo;s here today is the start of that
          structure, not the whole of it.
        </Text>
      </Container>

      <Container className="mt-10">
        <div className="mx-auto max-w-2xl">
          <GrowthStrip />
        </div>
      </Container>
    </Section>
  );
}
