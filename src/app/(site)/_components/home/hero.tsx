import { CircleCheck, Circle } from "lucide-react";

import { Button, Container, Eyebrow, Heading, ProgressRing, Section, Text } from "@/components/ui";

const sections = [
  { label: "Foundation", percent: 100 },
  { label: "Structure", percent: 100 },
  { label: "Details", percent: 60 },
  { label: "Review", percent: 20 },
];

/*
  One clean card, not a stack of offset rotated shapes - a single confident
  panel reads as an intentional product composition; multiple bare
  rotated rectangles peeking out from behind it reads as clutter. Depth
  comes from a real shadow and a thin accent-colored top edge, not more
  geometry.

  The body is a real (static) chart, not a skeleton loader: a progress
  ring plus a per-section breakdown, each row with its own percentage -
  so it reads as an illustration of "structured" rather than a row of
  meaningless gray bars. Row labels name generic planning *phases*
  (foundation, structure, details, review), never a specific plan type,
  so this still represents the concept of a structured planner rather
  than a real plan that exists yet.
*/
function StructurePreview() {
  const overall = Math.round(
    sections.reduce((sum, section) => sum + section.percent, 0) / sections.length,
  );

  return (
    <div aria-hidden="true" className="w-full max-w-md">
      <div className="overflow-hidden rounded-2xl border border-line-subtle bg-surface shadow-2xl">
        <div className="h-1.5 bg-brand" />

        <div className="p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-line-subtle pb-4">
            <div className="h-2.5 w-28 rounded-full bg-ink-faint/25" />
            <div className="rounded-full bg-accent-subtle px-2.5 py-1 text-label font-medium text-brand">
              Structured
            </div>
          </div>

          <div className="flex items-center gap-4 border-b border-line-subtle py-5">
            <ProgressRing percent={overall} size={60} strokeWidth={6} />
            <div>
              <Text as="p" weight="semibold" className="font-display text-h3 leading-none">
                {overall}%
              </Text>
              <Text size="caption" tone="faint" className="mt-1.5">
                Across {sections.length} sections
              </Text>
            </div>
          </div>

          <ul className="flex flex-col gap-3.5 pt-4">
            {sections.map((section) => (
              <li key={section.label} className="flex items-center gap-3">
                {section.percent === 100 ? (
                  <CircleCheck className="size-4 shrink-0 text-brand" strokeWidth={1.75} />
                ) : (
                  <Circle className="size-4 shrink-0 text-line-strong" strokeWidth={1.75} />
                )}
                <Text size="body-sm" tone="muted" className="w-24 shrink-0 truncate">
                  {section.label}
                </Text>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${section.percent}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-label font-medium text-ink-faint">
                  {section.percent}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/*
  A dark hero band (bg-deep, #000814) - a deliberate, high-contrast first
  impression, not a leftover dark-mode surface (there is no dark mode in
  this palette; this section simply always uses the dark brand color).

  Every text color on this band is explicitly one of the "on-deep"/accent
  tokens rather than the default `ink`/`brand` - #415A77 measures only
  2.8:1 against #000814, well short of the 4.5:1 text minimum, so it's
  used here for the button *fill* only (with a white label), never as text
  or a border directly on the dark surface. The primary CTA deliberately
  uses the light "secondary" button style instead of the brand-filled
  "primary" one, specifically so it reads clearly against this background.
*/
export function Hero() {
  return (
    <Section spacing="lg" background="deep">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col items-center gap-6 text-center">
            <Eyebrow
              tone="accent"
              className="animate-hero-in"
              style={{ animationDelay: "40ms" }}
            >
              Interactive digital planners
            </Eyebrow>
            <Heading
              as="h1"
              size="display"
              className="animate-hero-in text-ink-on-deep"
              style={{ animationDelay: "110ms" }}
            >
              Give your plans somewhere to live.
            </Heading>
            <Text
              size="body-lg"
              className="mx-auto max-w-xl animate-hero-in text-ink-on-deep-muted"
              style={{ animationDelay: "190ms" }}
            >
              Everplans is a digital planning platform built around interactive planners -
              structured, thoughtfully designed tools for the parts of life that deserve more
              than a note app, a spreadsheet, and a dozen open tabs.
            </Text>
            <div
              className="animate-hero-in flex flex-wrap justify-center gap-3 pt-2"
              style={{ animationDelay: "270ms" }}
            >
              <Button href="/planners" variant="secondary" size="lg">
                Explore Planners
              </Button>
              <Button href="/categories" variant="outline-on-dark" size="lg">
                Explore Categories
              </Button>
            </div>
          </div>

          <div
            className="animate-hero-in flex justify-center lg:justify-end"
            style={{ animationDelay: "220ms" }}
          >
            <StructurePreview />
          </div>
        </div>
      </Container>
    </Section>
  );
}
