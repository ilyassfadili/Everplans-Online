import { Button, Container, Heading, Section, Text } from "@/components/ui";

export function AboutFinalCta() {
  return (
    <Section background="brand">
      <Container size="narrow" className="text-center">
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
          <Button
            href="/contact"
            variant="outline"
            size="lg"
            className="border-ink-on-brand/30 text-ink-on-brand hover:bg-ink-on-brand/10"
          >
            Get in Touch
          </Button>
        </div>
      </Container>
    </Section>
  );
}
