import { PenTool, Sprout, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, Container, Heading, Icon, Section, Text } from "@/components/ui";

const pillars: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Target,
    title: "Purpose-built, not generic",
    body: "Every planner is shaped around the specific thing it's for - never a one-size-fits-all template stretched to cover everything.",
  },
  {
    icon: PenTool,
    title: "Built with intention",
    body: "Structure comes first. Each planner is designed deliberately around how that particular kind of planning actually works.",
  },
  {
    icon: Sprout,
    title: "Grows without buckling",
    body: "One platform holds every planner well - from the first one to the fiftieth - without straining under its own scope.",
  },
];

/*
  No logos, no numbers, no quotes - the section earns trust through the
  statement itself and the restraint of the page around it, since there's
  no real usage history yet to point to honestly. The three-part premise
  in the copy below gets its own card each, so the claim isn't just
  asserted once and left to float - it's broken into three concrete,
  scannable pieces.
*/
export function WhyEverplans() {
  return (
    <Section background="surface">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Heading as="h2" className="text-balance">
            Everplans isn’t trying to be everything. It’s trying to be the right structure for the
            thing you’re actually planning.
          </Heading>
          <Text size="body-lg" tone="muted" className="mx-auto mt-5 max-w-xl">
            That’s the whole premise - and it comes down to three things.
          </Text>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {pillars.map((pillar) => (
            <Card key={pillar.title} padding="lg" className="text-center sm:text-left">
              <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-accent-subtle text-brand sm:mx-0">
                <Icon icon={pillar.icon} />
              </div>
              <Text size="body-lg" weight="semibold" className="mt-5">
                {pillar.title}
              </Text>
              <Text size="body-sm" tone="muted" className="mt-2">
                {pillar.body}
              </Text>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
