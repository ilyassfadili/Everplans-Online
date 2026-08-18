import { FileText, Layers, LayoutGrid, NotebookPen } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, Container, Heading, Icon, Section, Text } from "@/components/ui";

const terms: { icon: LucideIcon; term: string; definition: string }[] = [
  {
    icon: Layers,
    term: "The platform",
    definition: "Everplans itself - the structure, categories, and experience everything else is built on.",
  },
  {
    icon: NotebookPen,
    term: "Planners",
    definition: "The interactive products people actually use - added one at a time, not all at once.",
  },
  {
    icon: LayoutGrid,
    term: "Categories",
    definition: "How planners are grouped, by the part of life or project they’re built for.",
  },
  {
    icon: FileText,
    term: "Content",
    definition: "Writing that supports the platform, independent of any specific planner.",
  },
];

export function Introduction() {
  return (
    <Section background="surface">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Heading as="h2">A platform, not a single tool</Heading>
          <Text size="body-lg" tone="muted" className="mt-4">
            Everplans is a platform for interactive digital planners - not one planning app, but a
            growing collection of them, organized by category and built for different kinds of
            plans. The platform comes first: the structure, the categories, the underlying
            experience. Planners are added as they’re built, each one designed around a specific
            kind of plan rather than trying to be everything at once.
          </Text>
        </div>

        <dl className="mt-10 grid gap-5 sm:grid-cols-2">
          {terms.map((item) => (
            <Card
              key={item.term}
              padding="lg"
              className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-accent-subtle text-brand">
                <Icon icon={item.icon} />
              </div>
              <dt className="text-body-lg font-semibold text-ink">{item.term}</dt>
              <dd>
                <Text size="body-sm" tone="muted">
                  {item.definition}
                </Text>
              </dd>
            </Card>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
