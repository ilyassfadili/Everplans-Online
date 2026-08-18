import { ArrowRight, LayoutGrid, NotebookPen } from "lucide-react";

import { Container, Heading, Section, Text } from "@/components/ui";

export function CategoriesToPlannersConnection() {
  return (
    <Section background="surface-muted">
      <Container size="narrow">
        <div className="text-center">
          <Heading as="h2">Categories organize. Planners do the work.</Heading>
          <Text size="body-lg" tone="muted" className="mx-auto mt-3 max-w-lg">
            The two work together: a category is how you find what you need, a planner is what
            you actually use.
          </Text>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <div className="flex w-full max-w-52 flex-col items-center gap-2 rounded-lg border border-line-subtle bg-surface p-6 text-center">
            <LayoutGrid className="size-6 text-brand" strokeWidth={1.75} aria-hidden="true" />
            <Text weight="semibold">Category</Text>
            <Text size="body-sm" tone="muted">
              A grouping - the discovery layer
            </Text>
          </div>

          <ArrowRight
            className="size-5 shrink-0 rotate-90 text-ink-faint sm:rotate-0"
            strokeWidth={1.75}
            aria-hidden="true"
          />

          <div className="flex w-full max-w-52 flex-col items-center gap-2 rounded-lg border border-line-subtle bg-surface p-6 text-center">
            <NotebookPen className="size-6 text-brand" strokeWidth={1.75} aria-hidden="true" />
            <Text weight="semibold">Planner</Text>
            <Text size="body-sm" tone="muted">
              The product - what you actually plan with
            </Text>
          </div>
        </div>
      </Container>
    </Section>
  );
}
