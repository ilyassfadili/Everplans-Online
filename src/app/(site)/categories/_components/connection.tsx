import { ArrowRight, LayoutGrid, NotebookPen } from "lucide-react";

import { Container, Heading, Icon, Reveal, Section, Text } from "@/components/ui";

export function CategoriesToPlannersConnection() {
  return (
    <Section background="surface-muted">
      <Container size="narrow">
        <Reveal className="text-center">
          <Heading as="h2">Categories organize. Planners do the work.</Heading>
          <Text size="body-lg" tone="muted" className="mx-auto mt-3 max-w-lg">
            The two work together: a category is how you find what you need, a planner is what
            you actually use.
          </Text>
        </Reveal>

        <Reveal
          delay={100}
          className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
        >
          <div className="flex w-full max-w-52 flex-col items-center gap-2 rounded-lg border border-line-subtle bg-surface p-6 text-center">
            <Icon icon={LayoutGrid} size="lg" className="text-brand" />
            <Text weight="semibold">Category</Text>
            <Text size="body-sm" tone="muted">
              A grouping - the discovery layer
            </Text>
          </div>

          <Icon icon={ArrowRight} size="md" className="shrink-0 rotate-90 text-ink-faint sm:rotate-0" />

          <div className="flex w-full max-w-52 flex-col items-center gap-2 rounded-lg border border-line-subtle bg-surface p-6 text-center">
            <Icon icon={NotebookPen} size="lg" className="text-brand" />
            <Text weight="semibold">Planner</Text>
            <Text size="body-sm" tone="muted">
              The product - what you actually plan with
            </Text>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
