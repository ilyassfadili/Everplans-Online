import { Button, Container, Heading, Reveal, Section, Text } from "@/components/ui";

export function ContactFinalCta() {
  return (
    <Section background="brand" spacing="sm">
      <Container size="narrow" className="text-center">
        <Reveal>
          <Heading as="h2" size="h3" className="text-ink-on-brand">
            Still exploring? Take a look around.
          </Heading>
          <Text className="mx-auto mt-3 max-w-md text-ink-on-brand/80">
            See what Everplans is building before you reach out.
          </Text>
          <div className="mt-6">
            <Button href="/about" variant="secondary">
              About Everplans
            </Button>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
