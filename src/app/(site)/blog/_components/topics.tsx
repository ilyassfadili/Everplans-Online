import { Badge, Container, Heading, Reveal, Section, Text } from "@/components/ui";

const topics = ["Planning", "Organization", "Getting started", "Product updates"];

/*
  Plain, non-interactive Badge elements - no onClick, no href, no hover
  affordance suggesting they filter anything. They describe the intended
  content pillars, not a live, clickable taxonomy that doesn't exist yet.
*/
export function Topics() {
  return (
    <Section background="canvas" spacing="sm">
      <Container size="narrow" className="text-center">
        <Reveal>
          <Heading as="h2" size="h4">
            What we’ll be writing about
          </Heading>
          <Text size="body-sm" tone="muted" className="mx-auto mt-2 max-w-md">
            The themes Everplans’ writing will build around as articles are published.
          </Text>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {topics.map((topic) => (
              <Badge key={topic} variant="neutral">
                {topic}
              </Badge>
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
