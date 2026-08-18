import { ArrowRight, Compass, NotebookPen, Plus, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button, Container, Eyebrow, Heading, Section, Text } from "@/components/ui";

/**
 * Same card chrome as Home's hero panel (white card, brand top edge,
 * header row with a title-bar skeleton and an accent badge) so the two
 * hero visuals read as one product - but the body is Planners' own
 * concept, not Home's: a shelf of card-shaped slots instead of a progress
 * ring. Each slot echoes the real `PlannerCard` anatomy (an icon mark, a
 * title/description pair, a trailing arrow) so it reads as "a preview of
 * what browsing the library will feel like."
 *
 * Same fix as Home's StructurePreview: the slot bodies are real (static)
 * words, not gray skeleton bars - a row of blank lines reads as "loading",
 * not as a product illustration. The three labels are the same generic
 * capability language the page's own DiscoveryIntroduction section uses
 * (Organize / Decide / Track), never an invented planner or category name,
 * so this still represents the *concept* of the library rather than a
 * catalog that doesn't exist yet. The fourth, dashed slot borrows
 * GrowthStrip's "+" language from further down this same page, so "still
 * growing" reads consistently in both places. `aria-hidden` because it
 * adds nothing a screen reader user needs beyond what the hero copy
 * already says.
 */
function LibraryPreview() {
  const cards: { icon: LucideIcon; title: string; note: string }[] = [
    { icon: NotebookPen, title: "Organize", note: "One place, not scattered" },
    { icon: Target, title: "Decide", note: "Walk through, not just fill in" },
    { icon: Compass, title: "Track", note: "See where you stand" },
  ];

  return (
    <div aria-hidden="true" className="w-full">
      <div className="overflow-hidden rounded-2xl border border-line-subtle bg-surface shadow-2xl">
        <div className="h-1.5 bg-brand" />

        <div className="p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-line-subtle pb-4">
            <div className="h-2.5 w-28 rounded-full bg-ink-faint/25" />
            <div className="rounded-full bg-accent-subtle px-2.5 py-1 text-label font-medium text-brand">
              Growing library
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-5">
            {cards.map((card) => (
              <div
                key={card.title}
                className="flex flex-col gap-3 rounded-xl border border-line-subtle bg-surface p-3.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-8 items-center justify-center rounded-full bg-accent-subtle text-brand">
                    <card.icon className="size-4" strokeWidth={1.75} />
                  </div>
                  <ArrowRight className="size-3.5 text-ink-disabled" strokeWidth={1.75} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-body-sm font-semibold text-ink">{card.title}</p>
                  <p className="text-caption text-ink-faint">{card.note}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-center rounded-xl border border-dashed border-line bg-transparent p-3.5">
              <Plus className="size-5 text-ink-disabled" strokeWidth={1.75} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
  A dark hero band (bg-deep, #000814), matching Home's opening move so the
  two most-visited pages share one unmistakable "first impression" -
  every text color here is explicitly one of the "on-deep"/accent tokens
  rather than the default `ink`/`brand`, for the same contrast reason
  documented on Home's hero: #415A77 measures only 2.8:1 against #000814,
  short of the text minimum, so it's used as a button *fill* only (white
  label), never as text or a border directly on the dark surface. The
  primary CTA uses the light "secondary" button style rather than the
  brand-filled "primary" one for the same reason Home's does.
*/
export function PlannersHero() {
  return (
    <Section spacing="lg" background="deep">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="text-center">
            <Eyebrow className="text-accent">Planners</Eyebrow>
            <Heading as="h1" size="display" className="mt-3 text-ink-on-deep">
              Structure for the plans that actually matter
            </Heading>
            <Text size="body-lg" className="mx-auto mt-5 max-w-xl text-ink-on-deep-muted">
              A planner on Everplans isn&rsquo;t a blank document - it&rsquo;s an interactive,
              structured tool built around one specific kind of plan, organized into steps you
              can work through, track, and come back to. We&rsquo;re building that library now,
              one category at a time.
            </Text>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              <Button
                href="/categories"
                variant="secondary"
                trailingIcon={<ArrowRight className="size-4" strokeWidth={1.75} aria-hidden="true" />}
              >
                Explore Categories
              </Button>
              <Button
                href="/about"
                variant="outline"
                className="border-ink-on-deep/30 text-ink-on-deep hover:bg-ink-on-deep/10"
              >
                About Everplans
              </Button>
            </div>
          </div>

          <LibraryPreview />
        </div>
      </Container>
    </Section>
  );
}
