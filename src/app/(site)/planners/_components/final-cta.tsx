import { ArrowRight, Briefcase, Home as HomeIcon, LayoutGrid, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button, Container, Heading, Icon, Section, Text } from "@/components/ui";

/**
 * Same two real domain words CategoryExploration uses earlier on this page
 * ("Life", "Work") - not a fabricated category list. Repeating them here,
 * as chips rather than a paragraph, is what ties this closing band back to
 * the concept the page just spent a whole section establishing, instead of
 * landing as a generic "explore categories" button with nothing behind it.
 */
function CategoryChips() {
  const chips: { icon: LucideIcon; label: string }[] = [
    { icon: HomeIcon, label: "Life" },
    { icon: Briefcase, label: "Work" },
  ];

  return (
    <div aria-hidden="true" className="flex flex-wrap items-center justify-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink-on-brand/25 bg-ink-on-brand/10 px-3.5 py-1.5 text-body-sm font-medium text-ink-on-brand"
        >
          <Icon icon={chip.icon} size="sm" />
          {chip.label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink-on-brand/30 px-3.5 py-1.5 text-body-sm text-ink-on-brand/70">
        <Icon icon={Plus} size="sm" />
        More forming
      </span>
    </div>
  );
}

export function PlannersFinalCta() {
  return (
    <Section background="brand" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(255,255,255,0.12),transparent)]"
      />

      <Container size="narrow" className="relative text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-ink-on-brand/25 bg-ink-on-brand/10 text-ink-on-brand">
          <Icon icon={LayoutGrid} />
        </div>

        <Heading as="h2" className="mt-5 text-ink-on-brand">
          See where your plan fits
        </Heading>
        <Text size="body-lg" className="mx-auto mt-4 max-w-lg text-ink-on-brand/80">
          Categories are the clearest way to see how Everplans is organized today - and where
          new planners will appear as the library grows.
        </Text>

        <div className="mt-7">
          <CategoryChips />
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <Button
            href="/categories"
            variant="secondary"
            size="lg"
            trailingIcon={<ArrowRight className="size-4" strokeWidth={1.75} aria-hidden="true" />}
          >
            Explore Categories
          </Button>
          <Button
            href="/about"
            variant="outline"
            size="lg"
            className="border-ink-on-brand/30 text-ink-on-brand hover:bg-ink-on-brand/10"
          >
            Read the Vision
          </Button>
        </div>
      </Container>
    </Section>
  );
}
