import { Button, Container, Eyebrow, Heading, Reveal, Section, Text } from "@/components/ui";

/**
 * A bento of bordered, unlabeled modules in varied sizes - same grammar as
 * the Planners hero's `LibraryPreview`, so the two pages read as one visual
 * language. The asymmetry is the point: unlike sizes and tones read as
 * "distinct groups sitting together," which is what a category system
 * actually looks like, without a list of invented category names. Not a
 * product screenshot - no title text, no fake metadata, just shape.
 */
function CategoryMotif() {
  const modules = [
    { span: "col-span-2 row-span-1", tone: "bg-deep border-line" },
    { span: "col-span-1 row-span-2", tone: "bg-brand border-line-subtle" },
    { span: "col-span-1 row-span-1", tone: "bg-accent-subtle border-line-subtle" },
    { span: "col-span-1 row-span-1", tone: "bg-surface border-line-subtle" },
    { span: "col-span-2 row-span-1", tone: "bg-accent border-line-subtle" },
  ];

  return (
    <div
      aria-hidden="true"
      className="grid h-72 w-full max-w-sm grid-cols-3 grid-rows-3 gap-3 rounded-xl border border-line-subtle bg-surface-muted/40 p-4"
    >
      {modules.map((module, index) => (
        <div key={index} className={`${module.span} rounded-lg border ${module.tone} shadow-sm`} />
      ))}
    </div>
  );
}

export function Categories() {
  return (
    <Section background="surface-muted">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="order-2 flex justify-center lg:order-1 lg:justify-start">
            <CategoryMotif />
          </Reveal>

          <Reveal
            delay={100}
            className="order-1 flex flex-col items-center gap-4 text-center lg:order-2 lg:items-start lg:text-left"
          >
            <Eyebrow>One platform, many ways to plan</Eyebrow>
            <Heading as="h2">Organized around what you’re actually planning</Heading>
            <Text size="body-lg" tone="muted">
              Every planner belongs to a category - a way of grouping planning experiences by the
              part of life or project they’re built for. As planners join the platform, categories
              are how you’ll find the ones that fit.
            </Text>
            <div className="pt-2">
              <Button href="/categories" variant="outline">
                Explore Categories
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
