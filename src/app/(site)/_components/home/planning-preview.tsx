"use client";

import { BarChart3, CircleCheck, Circle, LayoutGrid, ListChecks, RotateCcw, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

import { Container, Eyebrow, Heading, ProgressRing, Reveal, Section, Text } from "@/components/ui";
import { cn } from "@/lib/cn";

type ViewKey = "overview" | "steps" | "progress";

const views: { key: ViewKey; label: string; icon: LucideIcon }[] = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "steps", label: "Steps", icon: ListChecks },
  { key: "progress", label: "Progress", icon: TrendingUp },
];

const steps = [
  { label: "Define what you're planning", done: true },
  { label: "Break it into steps", done: true },
  { label: "Work through each one", done: false },
  { label: "Revisit as things change", done: false },
];

/*
  A sidebar + content shell - the shape of a real application, not a
  tabbed marketing card - because that's a more honest, more distinctive
  way to preview "what using Everplans might feel like" than a row of
  top tabs. Still entirely generic: no plan type, no real data, nothing
  here is a functioning planner. Client-side state is justified the same
  way it was before - it's the clearest way to show a plan has more than
  one facet without three static panels competing for space.
*/
export function PlanningPreview() {
  const [active, setActive] = useState<ViewKey>("overview");

  return (
    <Section background="surface">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>The planning experience</Eyebrow>
          <Heading as="h2" className="mt-3">
            One plan, seen from every angle
          </Heading>
          <Text size="body-lg" tone="muted" className="mx-auto mt-4 max-w-xl">
            A planner isn&rsquo;t a single page - it&rsquo;s a structure you can look at
            differently depending on what you need right now.
          </Text>
        </Reveal>

        <Reveal
          delay={100}
          className="mx-auto mt-12 grid max-w-4xl overflow-hidden rounded-2xl border border-line-subtle bg-surface shadow-xl sm:grid-cols-[13rem_1fr]"
        >
          <nav aria-label="Planning view" className="flex gap-1 overflow-x-auto border-b border-line-subtle bg-surface-muted p-3 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r sm:p-4">
            {views.map((view) => (
              <button
                key={view.key}
                type="button"
                aria-current={active === view.key ? "true" : undefined}
                onClick={() => setActive(view.key)}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-body-sm font-medium transition-colors duration-150 ease-standard",
                  active === view.key
                    ? "bg-surface text-ink shadow-sm"
                    : "text-ink-faint hover:bg-surface/60 hover:text-ink-muted",
                )}
              >
                <view.icon
                  className={cn("size-4 shrink-0", active === view.key ? "text-brand" : "text-ink-disabled")}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                {view.label}
              </button>
            ))}
          </nav>

          <div
            key={active}
            className="animate-accordion-reveal p-7 sm:p-9"
            role="region"
            aria-live="polite"
          >
            {active === "overview" && (
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-40 rounded-full bg-ink-faint/20" />
                  <div className="rounded-full bg-accent-subtle px-2.5 py-1 text-label font-medium text-brand">
                    In progress
                  </div>
                </div>

                <div className="mt-6 grid gap-8 sm:grid-cols-[auto_1fr]">
                  <div className="flex items-center gap-4">
                    <ProgressRing percent={62} />
                    <div>
                      <Text as="p" weight="semibold" className="font-display text-h3 leading-none">
                        62%
                      </Text>
                      <Text size="caption" tone="faint" className="mt-1.5">
                        Complete
                      </Text>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-1.5">
                      <BarChart3 className="size-3.5 text-ink-faint" strokeWidth={1.75} aria-hidden="true" />
                      <Text size="caption" tone="faint">
                        Activity by section
                      </Text>
                    </div>
                    <div className="flex h-16 items-end gap-2">
                      {[35, 70, 45, 90, 60, 25].map((height, i) => (
                        <div
                          key={i}
                          className={cn("flex-1 rounded-sm", i === 3 ? "bg-brand" : "bg-brand/25")}
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-3 gap-3 border-t border-line-subtle pt-6">
                  {[
                    { value: "4", label: "Sections", icon: LayoutGrid },
                    { value: "12", label: "Steps", icon: ListChecks },
                    { value: "3", label: "Done", icon: CircleCheck },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-start gap-2">
                      <stat.icon className="mt-0.5 size-4 shrink-0 text-ink-disabled" strokeWidth={1.75} aria-hidden="true" />
                      <div>
                        <Text as="p" weight="semibold" className="font-display text-h4 leading-none">
                          {stat.value}
                        </Text>
                        <Text size="caption" tone="faint" className="mt-1">
                          {stat.label}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {active === "steps" && (
              <ul className="flex flex-col gap-4">
                {steps.map((step) => (
                  <li key={step.label} className="flex items-center gap-3">
                    {step.done ? (
                      <CircleCheck className="size-5 shrink-0 text-brand" strokeWidth={1.75} />
                    ) : (
                      <Circle className="size-5 shrink-0 text-line-strong" strokeWidth={1.75} />
                    )}
                    <Text tone={step.done ? "faint" : "default"} className={step.done ? "line-through" : ""}>
                      {step.label}
                    </Text>
                  </li>
                ))}
              </ul>
            )}

            {active === "progress" && (
              <div>
                <div className="flex items-end justify-between">
                  <Text weight="semibold">Overall progress</Text>
                  <Text weight="semibold" className="font-display text-h3 leading-none">
                    62%
                  </Text>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div className="h-full w-[62%] rounded-full bg-brand" />
                </div>
                <div className="mt-7 flex flex-col gap-4 border-t border-line-subtle pt-6">
                  {[
                    { label: "Sections", value: 100, icon: LayoutGrid },
                    { label: "Steps", value: 58, icon: ListChecks },
                    { label: "Follow-through", value: 30, icon: RotateCcw },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3">
                      <row.icon
                        className="size-4 shrink-0 text-ink-disabled"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      <Text size="body-sm" tone="muted" className="w-28 shrink-0 truncate">
                        {row.label}
                      </Text>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${row.value}%` }} />
                      </div>
                      <Text
                        size="body-sm"
                        weight="medium"
                        tone="faint"
                        className="w-9 shrink-0 text-right tabular-nums"
                      >
                        {row.value}%
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
