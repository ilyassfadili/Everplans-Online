import { Layers, LayoutGrid, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Container, Eyebrow, Heading, Icon, Reveal, Section, Text } from "@/components/ui";

const stages: { icon: LucideIcon; label: string; detail: string }[] = [
  { icon: Layers, label: "The platform", detail: "Built first, and live today." },
  { icon: LayoutGrid, label: "Categories & planners", detail: "Added one at a time, deliberately." },
  { icon: Sparkles, label: "What's next", detail: "Shaped by real plans, not a fixed date." },
];

/*
  The copy already says "deliberate, one at a time, no fixed roadmap" - the
  three-stage track below makes that literal instead of just asserting it,
  the same way Values turns "what we hold to" into something scannable
  rather than a wall of prose.
*/
export function FutureOfEverplans() {
  return (
    <Section background="canvas">
      <Container size="narrow">
        <Reveal>
          <Eyebrow className="text-center">The road ahead</Eyebrow>
          <Heading as="h2" className="mt-3 text-center">
            Where this is going
          </Heading>
          <Text size="body-lg" tone="muted" className="mt-4">
            Everplans starts small on purpose - the platform first, with categories and planners
            added deliberately rather than all at once. Over time, that means more categories, more
            planners, and a wider range of things you can plan well.
          </Text>
          <Text size="body-lg" tone="muted" className="mt-4">
            There’s no fixed roadmap to promise against here - the platform grows as real planners
            are built to fill it, not on a schedule set in advance.
          </Text>
        </Reveal>

        <ol className="mt-10 grid grid-cols-1 gap-6 border-t border-line-subtle pt-8 sm:grid-cols-3 sm:gap-4">
          {stages.map((stage, index) => (
            <Reveal as="li" key={stage.label} delay={100 + index * 70} className="text-center">
              <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-accent-subtle text-brand">
                <Icon icon={stage.icon} size="sm" />
              </span>
              <Text size="body-sm" weight="semibold" className="mt-3">
                {stage.label}
              </Text>
              <Text size="caption" tone="muted" className="mt-1">
                {stage.detail}
              </Text>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
