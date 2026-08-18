import { Button, Container, Heading, Section, Text } from "@/components/ui";

export function FinalCta() {
  return (
    <Section background="brand">
      <Container size="narrow" className="text-center">
        <Heading as="h2" className="text-ink-on-brand">
          Start with a plan. Build from there.
        </Heading>
        <Text size="body-lg" className="mx-auto mt-4 max-w-lg text-ink-on-brand/80">
          Explore what Everplans is building, and see the planner built for what you’re working
          on when it’s ready.
        </Text>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <Button href="/planners" variant="secondary" size="lg">
            Explore Planners
          </Button>
          <Button
            href="/about"
            variant="outline"
            size="lg"
            className="border-ink-on-brand/30 text-ink-on-brand hover:bg-ink-on-brand/10"
          >
            Learn About Everplans
          </Button>
        </div>
      </Container>
    </Section>
  );
}
