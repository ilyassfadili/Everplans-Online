import { Container, Eyebrow, Heading, Reveal, Section, Text } from "@/components/ui";
import type { ProductLandingConfig } from "@/types/product-landing";

// Full literal strings, not an interpolated count - the Tailwind scanner
// needs each complete class name written out somewhere in source (see
// AGENTS.md's "Tailwind gotcha"). The brief caps this section at 3-4 steps.
const gridColsClass: Record<number, string> = {
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

/**
 * A connected path of numbered steps - same "line through circular
 * markers" pattern Home's own How It Works section uses, so this reads as
 * the same product family. Horizontal with the line along the top on larger
 * screens; a vertical line down the left on mobile.
 */
export function ProductHowItWorks({ config }: { config: ProductLandingConfig }) {
  const steps = config.howItWorks;

  return (
    <Section background="canvas">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <Heading as="h2" className="mt-3">
            {config.howItWorksHeading}
          </Heading>
        </Reveal>

        <ol className={`relative mt-14 grid gap-10 sm:gap-6 ${gridColsClass[steps.length] ?? "sm:grid-cols-4"}`}>
          <div
            aria-hidden="true"
            className="absolute left-[0.5rem] top-0 h-full w-px bg-line sm:left-0 sm:top-[0.5rem] sm:h-px sm:w-full"
          />
          {steps.map((step, i) => (
            <Reveal
              key={step.title}
              as="li"
              delay={i * 70}
              className="relative flex gap-4 pl-8 sm:flex-col sm:gap-0 sm:pl-0"
            >
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
