import { ArrowRight, BarChart3, LineChart, PieChart } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Container, Heading, Section, Text } from "@/components/ui";

/*
  A visual "before/after" that maps onto the copy beside it, rather than
  standing in as abstract decoration: the scattered cards are three
  different chart types - a bar chart, a pie chart, a line chart - the
  kind of thing that ends up buried in "a spreadsheet there," each shaped
  differently depending on where it was made, which is part of why none of
  it lines up. The four structured rows on the right are real example plan
  steps - the last one ("See what's left") deliberately echoes the second
  paragraph's closing line. Every fragment shares one CSS grid cell
  (`[grid-area:1/1]` on a `grid place-items-center` parent) so each centers
  on the same point before its own rotate/translate offset is applied -
  nothing collapses toward a corner, and the composition stays centered no
  matter how wide its column gets.
*/
function ScatteredToStructured() {
  const fragments: { icon: LucideIcon; rotate: string }[] = [
    { icon: BarChart3, rotate: "-rotate-6 -translate-x-7 -translate-y-6" },
    { icon: PieChart, rotate: "rotate-4 translate-x-7 translate-y-1" },
    { icon: LineChart, rotate: "-rotate-3 translate-y-9" },
  ];
  const steps = ["Define the goal", "List the key decisions", "Order the steps", "See what's left"];

  return (
    <div className="flex items-center justify-center gap-4 sm:gap-8" aria-hidden="true">
      <div className="grid h-40 w-full min-w-0 max-w-56 place-items-center sm:h-52">
        {fragments.map(({ icon: FragmentIcon, rotate }, i) => (
          <div
            key={i}
            className={`[grid-area:1/1] flex size-16 items-center justify-center rounded-xl border border-line bg-surface-muted shadow-sm ${rotate}`}
          >
            <FragmentIcon className="size-6 text-ink-faint" strokeWidth={1.5} />
          </div>
        ))}
      </div>

      <ArrowRight
        className="hidden size-5 shrink-0 text-ink-faint sm:block"
        strokeWidth={1.75}
        aria-hidden="true"
      />

      <div className="flex h-40 w-full min-w-0 max-w-56 flex-col justify-center gap-3 sm:h-52">
        {steps.map((label) => (
          <div key={label} className="flex items-center gap-2.5">
            <span className="size-2 shrink-0 rounded-full bg-brand" />
            <span className="truncate text-caption font-medium text-ink-muted">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Problem() {
  return (
    <Section background="canvas">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
            <Heading as="h2" className="text-balance">
              A plan starts in your head. Then it’s in five different apps.
            </Heading>
            <Text size="body-lg" tone="muted">
              A note here, a spreadsheet there, a dozen browser tabs holding the rest. Nothing
              about any single piece is wrong - the problem is that none of it lives anywhere
              together.
            </Text>
            <Text size="body-lg" tone="muted">
              Static documents don’t help much either. A template you fill in once
              doesn’t adapt as the plan changes, and it definitely doesn’t show you
              what’s actually left to do.
            </Text>
          </div>

          <ScatteredToStructured />
        </div>
      </Container>
    </Section>
  );
}
