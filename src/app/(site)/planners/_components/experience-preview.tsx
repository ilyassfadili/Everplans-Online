import { Check } from "lucide-react";

import { Container, Eyebrow, Heading, Reveal, Section, Text } from "@/components/ui";

const sections = ["Overview", "Decisions", "Timeline", "Notes"];

const checklist = [
  { label: "Define the outcome", done: true },
  { label: "List the key decisions", done: true },
  { label: "Add supporting notes", done: false },
];

/**
 * An annotated diagram of the interaction patterns a planner is designed
 * around - sections, progress, a checklist, notes - built from plain
 * tokens, not a screenshot of any real product.
 */
function PlannerAnatomy() {
  return (
    <div
      aria-hidden="true"
      className="grid overflow-hidden rounded-xl border border-line-subtle bg-surface shadow-md sm:grid-cols-[13rem_1fr]"
    >
      <div className="flex flex-col gap-1 border-b border-line-subtle bg-surface-muted/40 p-4 sm:border-b-0 sm:border-r">
        {sections.map((section, index) => (
          <div
            key={section}
            className={`rounded-md px-3 py-2 text-body-sm ${
              index === 0 ? "bg-accent-subtle font-medium text-brand" : "text-ink-muted"
            }`}
          >
            {section}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-6 p-6">
        <div>
          <div className="flex items-center justify-between text-caption text-ink-faint">
            <span>Step 3 of 5</span>
            <span>60%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line-subtle">
            <div className="h-full w-3/5 rounded-full bg-brand" />
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                  item.done ? "border-brand bg-brand text-ink-on-brand" : "border-line-strong"
                }`}
              >
                {item.done && <Check className="size-3" strokeWidth={2.5} />}
              </span>
              <span className={`text-body-sm ${item.done ? "text-ink-muted line-through" : "text-ink"}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5 rounded-md border border-line-subtle p-3">
          <div className="h-2 w-1/4 rounded-full bg-line-subtle" />
          <div className="h-2 w-full rounded-full bg-line-subtle" />
          <div className="h-2 w-4/5 rounded-full bg-line-subtle" />
        </div>
      </div>
    </div>
  );
}

export function ExperiencePreview() {
  return (
    <Section background="surface">
      <Container size="narrow" className="text-center">
        <Reveal>
          <Eyebrow>The mechanics</Eyebrow>
          <Heading as="h2" className="mt-3">
            What makes it different from a document
          </Heading>
          <Text size="body-lg" tone="muted" className="mx-auto mt-4 max-w-xl">
            Sections, progress, and a checklist you can act on - a planner is built to hold a plan
            in motion, not just record it once.
          </Text>
        </Reveal>
      </Container>

      <Container className="mt-10">
        <Reveal delay={100} className="mx-auto max-w-3xl">
          <PlannerAnatomy />
        </Reveal>
      </Container>
    </Section>
  );
}
