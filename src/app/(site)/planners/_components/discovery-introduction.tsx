import { GitBranch, Layers, RotateCcw, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Container, Heading, Icon, Section, Text } from "@/components/ui";

const capabilities: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Layers,
    title: "Organize",
    description: "Everything related to one plan lives in one place, not scattered across notes and tabs.",
  },
  {
    icon: GitBranch,
    title: "Decide",
    description: "A planner is built to walk you through decisions, not just collect information.",
  },
  {
    icon: TrendingUp,
    title: "Track",
    description: "See where you stand in a plan at a glance, and know what's left to work through.",
  },
  {
    icon: RotateCcw,
    title: "Return",
    description: "Plans change. A planner is meant to be reopened and adjusted, not filled out once.",
  },
];

/**
 * Conceptual product positioning - how a planner is meant to work, not a
 * feature list the planner engine currently implements (it doesn't exist
 * yet). Kept short and editorial by design.
 */
export function DiscoveryIntroduction() {
  return (
    <Section background="surface">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <Heading as="h2" className="text-balance">
              How a planner is meant to work
            </Heading>
            <Text size="body-lg" tone="muted" className="mx-auto mt-4 max-w-md lg:mx-0">
              A planner isn&rsquo;t a document you fill out once and forget - it&rsquo;s an
              interactive space designed around the specific thing you&rsquo;re planning,
              built to bring structure and clarity to it.
            </Text>
          </div>

          <dl className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
            {capabilities.map((capability) => (
              <div
                key={capability.title}
                className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-accent-subtle text-brand">
                  <Icon icon={capability.icon} />
                </div>
                <dt className="text-body font-semibold text-ink">{capability.title}</dt>
                <dd className="text-body-sm text-ink-muted">{capability.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </Section>
  );
}
