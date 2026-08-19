import { Container, Heading, Reveal, Section, Text } from "@/components/ui";

/*
  The one section built on the accent tint - a light wash derived from the
  brand secondary color (#415A77 mixed toward white) - the "genuinely
  experimental" moment the brief calls for, used exactly once so it stays
  a moment rather than a motif.

  A soft radial highlight (accent-subtle bleeding into transparent, both
  already tokens - no color introduced outside the three-hue palette) gives
  the band a sense of depth instead of a flat fill, and a short brand-colored
  rule anchors the eyebrow the way Hero's accent top edge anchors its card.
  `spacing="lg"` gives it more room to breathe than the default sections
  either side, so the "moment" actually reads as one.

  Text uses `ink-on-accent` (a fixed dark neutral) rather than the default
  `ink`, since it's specifically paired with the accent background - same
  pattern as `ink-on-brand`/`ink-on-deep` on the other banded sections,
  just for this lighter surface.
*/
export function FutureVision() {
  return (
    <Section spacing="lg" background="accent" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_0%,var(--accent-subtle),transparent)]"
      />
      <Container size="narrow" className="relative">
        <Reveal className="text-center">
          <span className="mx-auto block h-0.5 w-10 rounded-full bg-brand" />
          <Text
            size="label"
            weight="semibold"
            className="mt-6 uppercase tracking-[0.08em] text-ink-on-accent/70"
          >
            The bigger picture
          </Text>
          <Heading as="h2" size="display" className="mt-4 text-balance text-ink-on-accent">
            Everplans isn’t meant to be one planner. It’s meant to be a home for many of them.
          </Heading>
          <Text size="body-lg" className="mx-auto mt-5 max-w-xl text-ink-on-accent/80">
            Categories, structure, and the platform underneath come first - planners are added
            deliberately as they’re built, each one shaped around a real kind of plan rather than
            released to hit a schedule.
          </Text>
        </Reveal>
      </Container>
    </Section>
  );
}
