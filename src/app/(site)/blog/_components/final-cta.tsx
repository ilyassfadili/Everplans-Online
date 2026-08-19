import { Button, Container, Heading, Reveal, Section, Text } from "@/components/ui";

export function BlogFinalCta() {
  return (
    <Section background="brand">
      <Container size="narrow" className="text-center">
        <Reveal>
          <Heading as="h2" className="text-ink-on-brand">
            More to read soon - more to plan with, too
          </Heading>
          <Text size="body-lg" className="mx-auto mt-4 max-w-lg text-ink-on-brand/80">
            While the writing takes shape, take a look at what Everplans is building toward.
          </Text>
          <div className="mt-8">
            <Button href="/planners" variant="secondary" size="lg">
              Explore Planners
            </Button>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
