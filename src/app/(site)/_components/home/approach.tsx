import { Card, Container, Eyebrow, Heading, Reveal, Section, Text } from "@/components/ui";

const principles = [
  {
    n: "01",
    title: "Clarity over clutter",
    body: "See the whole plan, not just the next task. Everplans keeps the big picture and the small steps in the same place.",
  },
  {
    n: "02",
    title: "Structure without complexity",
    body: "Enough shape to be genuinely useful - not a system you have to maintain on top of the thing you're actually planning.",
  },
  {
    n: "03",
    title: "Progress you can see",
    body: "What's done and what's left, without digging through old notes or a dozen open tabs to find out.",
  },
  {
    n: "04",
    title: "Designed around real life",
    body: "A planner built for the specific thing you're working on - not a generic productivity framework stretched to fit everything.",
  },
];

/*
  Large index numerals carry the visual weight instead of icons - an
  editorial device (each principle reads like a numbered entry), distinct
  from the numbered-sequence treatment "How Everplans Works" uses later
  for progression, so the two numbered sections don't feel like repeats.

  Each principle is its own Card (the site's standard grouping primitive,
  reused rather than hand-rolled) in a 2x2 grid, on a surface-muted section
  so the white cards actually separate from the page instead of blending
  into it - canvas and surface are both literal white in this palette, so a
  border alone wouldn't read as a distinct card against either.
*/
export function Approach() {
  return (
    <Section background="surface-muted">
      <Container>
        <Reveal className="mx-auto max-w-xl text-center">
          <Eyebrow>The approach</Eyebrow>
          <Heading as="h2" className="mt-3">
            What makes it different
          </Heading>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {principles.map((principle, index) => (
            <Reveal key={principle.n} delay={index * 70}>
              <Card
                padding="lg"
                className="flex h-full flex-col items-center gap-3 text-center sm:items-start sm:text-left"
              >
                <span className="font-display text-4xl font-medium text-line-strong">
                  {principle.n}
                </span>
                <Text size="body-lg" weight="semibold">
                  {principle.title}
                </Text>
                <Text tone="muted">{principle.body}</Text>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
