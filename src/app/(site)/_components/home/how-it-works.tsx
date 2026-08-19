import { Container, Eyebrow, Heading, Reveal, Section, Text } from "@/components/ui";

const steps = [
  { title: "Choose what you’re planning", body: "Find the planner built for the specific thing you’re working on." },
  { title: "Organize what matters", body: "Everything relevant lives in one structured place from the start." },
  { title: "Work through the plan", body: "Move through it at your pace - nothing to fill out all at once." },
  { title: "See your progress", body: "Know what’s done and what’s left without re-reading everything." },
];

/*
  A connected path - a line running through circular step-markers - rather
  than icon+title+paragraph cards. Horizontal with the line along the top
  on larger screens; a vertical line down the left on mobile, so the
  "connection" reads correctly in both orientations instead of just
  disappearing on small screens.
*/
export function HowItWorks() {
  return (
    <Section background="canvas">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <Heading as="h2" className="mt-3">
            From idea to something you can actually work through
          </Heading>
        </Reveal>

        <ol className="relative mt-14 grid gap-10 sm:grid-cols-4 sm:gap-6">
          <div
            aria-hidden="true"
            className="absolute left-[0.5rem] top-0 h-full w-px bg-line sm:left-0 sm:top-[0.5rem] sm:h-px sm:w-full"
          />
          {steps.map((step, i) => (
            <Reveal key={step.title} as="li" delay={i * 70} className="relative flex gap-4 pl-8 sm:flex-col sm:gap-0 sm:pl-0">
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 flex size-4 items-center justify-center rounded-full border-2 border-brand bg-canvas sm:relative sm:mb-6"
              />
              <div>
                <Text size="label" tone="faint" weight="semibold" className="uppercase tracking-[0.08em]">
                  Step {i + 1}
                </Text>
                <Text size="body-lg" weight="semibold" className="mt-1.5">
                  {step.title}
                </Text>
                <Text size="body-sm" tone="muted" className="mt-1.5">
                  {step.body}
                </Text>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
