import { Container, Eyebrow, Heading, Section, Text } from "@/components/ui";

/*
  Dark hero band (bg-deep, #000814), matching Home and Planners so every
  major page opens on the same signature surface. Text colors are the
  "on-deep"/accent tokens rather than default `ink`/`brand` for the usual
  contrast reason: #415A77 measures only 2.8:1 against #000814.
*/
export function ContactHero() {
  return (
    <Section spacing="lg" background="deep">
      <Container size="narrow" className="text-center">
        <Eyebrow className="text-accent">Contact</Eyebrow>
        <Heading as="h1" size="display" className="mt-3 text-ink-on-deep">
          Send us a message
        </Heading>
        <Text size="body-lg" className="mx-auto mt-4 max-w-xl text-ink-on-deep-muted">
          Questions about Everplans, feedback on what you’d like to see, or something else
          entirely - this is the direct line.
        </Text>
      </Container>
    </Section>
  );
}
