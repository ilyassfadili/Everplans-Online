import { Compass, RefreshCw, Route } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Container, Eyebrow, Heading, Icon, Reveal, Section, Text } from "@/components/ui";

const features: { icon: LucideIcon; title: string; benefit: string }[] = [
  {
    icon: Route,
    title: "Guided steps",
    benefit: "You always know what comes next - no wondering where you left off.",
  },
  {
    icon: Compass,
    title: "Reusable structure",
    benefit: "The shape of the plan is already there, so you spend your time on the plan itself.",
  },
  {
    icon: RefreshCw,
    title: "Built to revisit",
    benefit: "Plans change. Come back, adjust, and keep going instead of starting over.",
  },
];

export function Showcase() {
  return (
    <Section background="canvas">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal className="flex flex-col items-center justify-center gap-4 text-center lg:items-start lg:text-left">
            <Eyebrow>Inside a planner</Eyebrow>
            <Heading as="h2">Every quality serves the same goal</Heading>
            <Text size="body-lg" tone="muted">
              None of this is complexity for its own sake. Every part of a planner exists to make
              the actual planning easier - not to give you more to manage.
            </Text>
          </Reveal>

          <div className="flex flex-col divide-y divide-line-subtle">
            {features.map((feature, index) => (
              <Reveal
                key={feature.title}
                delay={100 + index * 70}
                className="flex gap-5 py-6 first:pt-0 last:pb-0"
              >
                <Icon icon={feature.icon} size="lg" className="mt-0.5 shrink-0 text-brand" />
                <div>
                  <Text size="body-lg" weight="semibold">
                    {feature.title}
                  </Text>
                  <Text tone="muted" className="mt-1">
                    {feature.benefit}
                  </Text>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
