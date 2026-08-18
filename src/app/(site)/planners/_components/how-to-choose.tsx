import { Card, Container, Eyebrow, Heading, Section, Text } from "@/components/ui";

const steps: { number: string; title: string; description: string }[] = [
  {
    number: "01",
    title: "Start with what you're trying to accomplish",
    description:
      "Before picking a planner, get clear on the outcome - a decision, an event, a transition. That's what determines which planner actually fits.",
  },
  {
    number: "02",
    title: "Find the category it belongs to",
    description:
      "Categories group planners by the part of life or work they're built for - the fastest way to narrow the list once there is one to narrow.",
  },
  {
    number: "03",
    title: "Choose the level of structure you need",
    description:
      "Some plans need a strict sequence of steps; others need a flexible set of sections you can revisit in any order. The right planner matches that.",
  },
  {
    number: "04",
    title: "Work through it, then keep it open",
    description:
      "A planner isn't finished the first time you close it. Come back as circumstances change and the plan needs to move with you.",
  },
];

export function HowToChoose() {
  return (
    <Section background="canvas">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Choosing a planner</Eyebrow>
          <Heading as="h2" className="mt-3">
            How to choose the right planner
          </Heading>
        </div>

        <ol className="mt-10 grid gap-5 sm:grid-cols-2">
          {steps.map((step) => (
            <Card
              as="li"
              key={step.number}
              padding="lg"
              className="flex flex-col items-center text-center sm:items-start sm:text-left"
            >
              <span
                className="flex size-10 items-center justify-center rounded-full bg-accent-subtle font-display text-body font-medium text-brand"
                aria-hidden="true"
              >
                {step.number}
              </span>
              <Text as="p" weight="semibold" className="mt-4 text-body-lg">
                {step.title}
              </Text>
              <Text size="body-sm" tone="muted" className="mt-2">
                {step.description}
              </Text>
            </Card>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
