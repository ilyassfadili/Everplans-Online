import { Container, Heading, Section, Text } from "@/components/ui";

export function CategoryIntroduction() {
  return (
    <Section background="surface" spacing="sm">
      <Container size="narrow" className="text-center">
        <Heading as="h2" size="h3">
          One structure, many kinds of plans
        </Heading>
        <Text tone="muted" className="mx-auto mt-3 max-w-lg">
          Rather than one generic planning tool, Everplans is organized around categories - each
          one a group of planners built for a particular kind of project or milestone. New
          categories open up as new planners join the platform.
        </Text>
      </Container>
    </Section>
  );
}
