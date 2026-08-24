import { LayoutGrid, Plus } from "lucide-react";

import { Container, Eyebrow, Heading, Icon, Reveal, Section, Text } from "@/components/ui";

/**
 * Two honest states instead of an unlabeled bar chart: what's live today
 * (the platform and its category structure) and what's still ahead (the
 * planner library itself - per the copy above, "the start of that
 * structure, not the whole of it"). No invented counts, dates, or planner
 * names - just the same "solid card = real, dashed card = still forming"
 * language CategoryExploration and PlannersFinalCta already use elsewhere
 * on this page. `LayoutGrid` deliberately echoes the icon PlannersFinalCta's
 * closing badge uses for the same "categories" idea, so the page's opening
 * and closing "what exists" moments read as one visual language. Two flexed
 * cards plus a short connector, stacking on mobile - unlike the bar chart
 * this replaces, nothing here has a fixed width that can overflow.
 */
function GrowthPath() {
  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex flex-1 items-center gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-col sm:gap-3 sm:p-5 sm:text-center">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-brand">
          <Icon icon={LayoutGrid} size="sm" />
        </div>
        <div className="flex flex-col">
          <p className="text-body-sm font-semibold text-ink">Wedding Planner</p>
          <p className="text-caption text-ink-faint">Live today</p>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="h-4 w-px self-center border-l border-dashed border-line sm:h-px sm:w-10 sm:border-l-0 sm:border-t"
      />

      <div className="flex flex-1 items-center gap-3 rounded-xl border border-dashed border-line bg-transparent p-4 sm:flex-col sm:gap-3 sm:p-5 sm:text-center">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink-disabled">
          <Icon icon={Plus} size="sm" />
        </div>
        <div className="flex flex-col">
          <p className="text-body-sm font-semibold text-ink">A growing library</p>
          <p className="text-caption text-ink-faint">What we&rsquo;re building toward</p>
        </div>
      </div>
    </div>
  );
}

export function FutureVision() {
  return (
    <Section background="surface-muted">
      <Container size="narrow" className="text-center">
        <Reveal>
          <Eyebrow>What&rsquo;s ahead</Eyebrow>
          <Heading as="h2" className="mt-3">
            Built to grow into a full library
          </Heading>
          <Text size="body-lg" tone="muted" className="mx-auto mt-4 max-w-lg">
            Everplans is designed as a foundation for many planners across many categories - not a
            single product, but a growing collection. What&rsquo;s here today is the start of
            that structure, not the whole of it.
          </Text>
        </Reveal>
      </Container>

      <Container className="mt-10">
        <Reveal delay={100} className="mx-auto max-w-xl">
          <GrowthPath />
        </Reveal>
      </Container>
    </Section>
  );
}
