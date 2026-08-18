import { Compass, Eye, LayoutGrid, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Container, Heading, Icon, Section, Text } from "@/components/ui";

const principles: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Eye,
    title: "Clarity over clutter",
    body: "A plan should be easier to understand after you open it, not harder. Everplans is built around showing what matters and quietly setting the rest aside.",
  },
  {
    icon: LayoutGrid,
    title: "Structure without complexity",
    body: "Structure is what makes a plan usable, but structure can also become its own burden. Every planner aims for just enough organization to be genuinely helpful, not a system you have to maintain.",
  },
  {
    icon: TrendingUp,
    title: "Progress you can actually see",
    body: "Knowing what’s done and what’s left shouldn’t require re-reading everything. Progress is treated as something to show, not something to infer.",
  },
  {
    icon: Compass,
    title: "Designed around real plans, not abstractions",
    body: "A planner is built around a specific kind of plan, with its own shape and steps, not a generic productivity framework stretched to fit everything.",
  },
];

/*
  Icon-led row list, deliberately a third composition rather than a repeat
  of the other two treatments this same idea already gets on the site:
  Introduction (above, on this page) covers the card-plus-icon-badge grid,
  and Home's Approach section owns the large-numeral card grid. Here each
  principle gets a meaning-bearing icon - what the idea is about, not its
  position in a sequence - in a single-column list with hairline dividers,
  a lighter and more editorial rhythm that fits a page reading like an essay.
*/
export function Philosophy() {
  return (
    <Section background="canvas">
      <Container size="narrow">
        <Heading as="h2" className="text-center">
          The thinking behind it
        </Heading>
        <div className="mt-10 flex flex-col divide-y divide-line-subtle border-t border-line-subtle">
          {principles.map((principle) => (
            <div key={principle.title} className="flex gap-5 py-7 sm:gap-6">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-brand">
                <Icon icon={principle.icon} />
              </div>
              <div>
                <Text weight="semibold" size="body-lg">
                  {principle.title}
                </Text>
                <Text tone="muted" className="mt-1.5">
                  {principle.body}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
