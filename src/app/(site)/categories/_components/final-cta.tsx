import { Button, Container, Heading, Section, Text } from "@/components/ui";

export function CategoriesFinalCta() {
  return (
    <Section background="brand">
      <Container size="narrow" className="text-center">
        <Heading as="h2" className="text-ink-on-brand">
          See what a planner actually looks like
        </Heading>
        <Text size="body-lg" className="mx-auto mt-4 max-w-lg text-ink-on-brand/80">
          Categories are the map. Planners are the destination - take a look at what Everplans
          is building toward.
        </Text>
        <div className="mt-8">
          <Button href="/planners" variant="secondary" size="lg">
            Explore Planners
          </Button>
        </div>
      </Container>
    </Section>
  );
}
