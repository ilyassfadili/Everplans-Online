import { Boxes, Lightbulb, TrendingUp, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, Container, Heading, Icon, Section, Text } from "@/components/ui";

const values: { icon: LucideIcon; word: string; detail: string }[] = [
  { icon: Lightbulb, word: "Clarity.", detail: "If it’s not clear, it’s not finished." },
  { icon: Boxes, word: "Structure.", detail: "Every plan deserves real shape, not a blank page." },
  { icon: TrendingUp, word: "Progress.", detail: "Visible, not something you have to dig for." },
  { icon: Wrench, word: "Practicality.", detail: "Built for the plan you actually have, not an ideal one." },
];

/*
  Deliberately crisp - single word + one short line - a different rhetorical
  mode from Philosophy's fuller paragraphs above, even though the themes
  are naturally related. One explains; this one just states it.

  Cards on a surface-muted band, the same treatment Home's Approach section
  uses: canvas and surface both render literal white, so a border alone
  wouldn't separate a white card from either - surface-muted gives the
  cards something to actually sit on.
*/
export function Values() {
  return (
    <Section background="surface-muted">
      <Container size="narrow">
        <Heading as="h2" size="h3" className="text-center">
          What we hold to
        </Heading>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {values.map((value) => (
            <Card as="li" key={value.word} padding="lg">
              <div className="flex size-10 items-center justify-center rounded-full bg-accent-subtle text-brand">
                <Icon icon={value.icon} size="sm" />
              </div>
              <Text size="body-lg" weight="semibold" className="mt-4 font-display">
                {value.word}
              </Text>
              <Text size="body-sm" tone="muted" className="mt-1">
                {value.detail}
              </Text>
            </Card>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
