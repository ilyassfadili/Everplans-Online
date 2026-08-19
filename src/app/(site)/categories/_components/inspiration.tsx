import { Container, Heading, Reveal, Section, Text } from "@/components/ui";

const prompts = [
  "A big move or milestone",
  "A project you keep putting off",
  "Something you want to plan properly, for once",
  "A goal with more moving parts than one list can hold",
];

/*
  Deliberately phrased as generic situations, not named products - a plain
  text list rather than card/badge tiles, so it can't be mistaken for a
  real category listing.
*/
export function Inspiration() {
  return (
    <Section background="canvas">
      <Container size="narrow" className="text-center">
        <Reveal>
          <Heading as="h2">What are you working toward?</Heading>
          <Text size="body-lg" tone="muted" className="mx-auto mt-3 max-w-lg">
            Everplans is built for the kind of planning that doesn’t fit on a sticky note -
            whatever that looks like for you.
          </Text>
        </Reveal>

        <ul className="mx-auto mt-10 flex max-w-xl flex-col divide-y divide-line-subtle border-y border-line-subtle text-left">
          {prompts.map((prompt, index) => (
            <Reveal as="li" key={prompt} delay={100 + index * 70} className="py-4 text-body text-ink-muted">
              {prompt}
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
