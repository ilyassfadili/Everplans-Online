import { ArrowRight, Briefcase, Home as HomeIcon, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button, Container, Eyebrow, Heading, Icon, Section, Text } from "@/components/ui";

/**
 * A row standing in for one category once real categories exist. Same fix
 * as the hero's LibraryPreview: a gray skeleton bar reads as "loading", not
 * as a product illustration, so the row uses real words instead - but only
 * the two domain words this section's own copy already uses ("life or
 * work"), never an invented category name like "Estate Planning". The third
 * slot is a dashed "still forming" row rather than a fabricated third
 * category, echoing the copy directly below it and the same dashed "+"
 * language the hero preview uses for its own growing-library slot.
 */
function CategoryRow({ icon, label, note }: { icon: LucideIcon; label: string; note: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line-subtle bg-surface p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent-subtle text-brand">
        <Icon icon={icon} size="sm" />
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="text-body-sm font-semibold text-ink">{label}</p>
        <p className="text-caption text-ink-faint">{note}</p>
      </div>
      <Icon icon={ArrowRight} size="sm" className="shrink-0 text-ink-disabled" />
    </div>
  );
}

/** Decorative preview of a future category list. No invented category names. */
function CategoryPreview() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-3 rounded-xl border border-line-subtle bg-surface-muted/40 p-4"
    >
      <CategoryRow icon={HomeIcon} label="Life" note="The everyday and ongoing" />
      <CategoryRow icon={Briefcase} label="Work" note="Career and professional plans" />
      <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-line p-3 text-ink-disabled">
        <Icon icon={Plus} size="sm" />
        <span className="text-caption">More forming</span>
      </div>
    </div>
  );
}

export function CategoryExploration() {
  return (
    <Section background="surface-muted">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <Eyebrow>Categories</Eyebrow>
            <Heading as="h2" className="mt-3">
              Another way to find the right planner
            </Heading>
            <Text size="body-lg" tone="muted" className="mt-4 max-w-lg">
              Every planner will belong to a category - the part of life or work it&rsquo;s
              built for. Categories are still forming as planners are added, but they&rsquo;re
              designed to be the fastest way to go from &ldquo;I need help with this&rdquo; to
              the right planner.
            </Text>
            <div className="mt-6">
              <Button href="/categories" variant="outline">
                Explore Categories
              </Button>
            </div>
          </div>

          <CategoryPreview />
        </div>
      </Container>
    </Section>
  );
}
