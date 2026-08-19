import { Container, Heading, Reveal, Section, Text } from "@/components/ui";

const values: { word: string; detail: string }[] = [
  { word: "Clarity.", detail: "If it’s not clear, it’s not finished." },
  { word: "Structure.", detail: "Every plan deserves real shape, not a blank page." },
  { word: "Progress.", detail: "Visible, not something you have to dig for." },
  { word: "Practicality.", detail: "Built for the plan you actually have, not an ideal one." },
];

/*
  By the time a reader reaches this section, Introduction, Philosophy, and
  Future have each already paired a circular icon badge with a heading and
  a line of copy - a fourth repetition would read as templated rather than
  composed. Same four words, same copy, deliberately different mode: a
  text-led numbered index instead of an icon, set directly on the section
  band with no card container. The numerals are a graphic/ordering device,
  not a literal sequence (these four hold equally, none comes "first"), so
  the list stays a <ul> and the digits are aria-hidden - a screen reader
  gets "list of 4 items," sighted readers get the editorial numbering.
*/
export function Values() {
  return (
    <Section background="surface-muted">
      <Container size="narrow">
        <Reveal>
          <Heading as="h2" size="h3" className="text-center">
            What we hold to
          </Heading>
        </Reveal>
        <ul className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {values.map((value, index) => (
            <Reveal
              as="li"
              key={value.word}
              delay={100 + index * 70}
              className="border-t border-line-subtle pt-5"
            >
              <Text
                as="span"
                aria-hidden="true"
                className="block font-display text-h3 font-medium text-brand"
              >
                {String(index + 1).padStart(2, "0")}
              </Text>
              <Text size="body-lg" weight="semibold" className="mt-2 font-display">
                {value.word}
              </Text>
              <Text size="body-sm" tone="muted" className="mt-1">
                {value.detail}
              </Text>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
