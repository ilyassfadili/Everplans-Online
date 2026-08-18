import { Container, Eyebrow, Heading, Section, Text } from "@/components/ui";

/*
  Dark hero band (bg-deep, #000814), matching Home and Planners so every
  major page opens on the same signature surface. Text colors are the
  "on-deep"/accent tokens rather than default `ink`/`brand` for the usual
  contrast reason: #415A77 measures only 2.8:1 against #000814.
*/
export function AboutHero() {
  return (
    <Section spacing="lg" background="deep">
      <Container size="narrow" className="text-center">
        <Eyebrow className="text-accent">About Everplans</Eyebrow>
        <Heading as="h1" size="display" className="mt-3 text-ink-on-deep">
          Planning shouldn’t be the hard part
        </Heading>
        <Text size="body-lg" className="mx-auto mt-4 max-w-xl text-ink-on-deep-muted">
          Everplans exists because planning something well takes more than a blank document and
          good intentions - it takes structure. We’re building the platform to provide it.
        </Text>
      </Container>
    </Section>
  );
}
