import { Button, Container, Heading, Reveal, Section, Text } from "@/components/ui";

export function AboutFinalCta() {
  return (
    <Section background="brand">
      <Container size="narrow" className="text-center">
        <Reveal>
          <Heading as="h2" className="text-ink-on-brand">
            See what this looks like in practice
          </Heading>
          <Text size="body-lg" className="mx-auto mt-4 max-w-lg text-ink-on-brand/80">
            Take a look at the planners Everplans is building toward.
          </Text>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <Button href="/planners" variant="secondary" size="lg">
              Explore Planners
            </Button>
            <Button href="/contact" variant="outline-on-dark" size="lg">
              Get in Touch
            </Button>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
