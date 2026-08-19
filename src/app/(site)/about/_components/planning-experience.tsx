import { Container, Heading, Reveal, Section, Text } from "@/components/ui";

export function PlanningExperience() {
  return (
    <Section background="surface-muted" spacing="sm">
      <Container size="narrow" className="text-center">
        <Reveal>
          <Heading as="h2" className="text-balance">
            Every planner, whatever it’s for, is built around the same idea: clarity you can act
            on.
          </Heading>
          <Text size="body-lg" tone="muted" className="mx-auto mt-4 max-w-xl">
            Not a static form to fill in once, but a structured space designed to be worked
            through, revisited, and adjusted as the plan itself changes.
          </Text>
        </Reveal>
      </Container>
    </Section>
  );
}
