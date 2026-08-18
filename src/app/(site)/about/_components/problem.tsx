import { AppWindow, MessageSquare, NotebookPen, Table2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Container, Heading, Icon, Section, Text } from "@/components/ui";

/*
  A loose, overlapping scatter of the four places the paragraph beside it
  names by name - note app, spreadsheet, browser tabs, messages - rather
  than an invented "before" diagram. Each chip shares one grid cell
  ([grid-area:1/1] on a place-items-center parent) so the rotate/translate
  offsets read as "scattered around a center point," not "drifting toward
  a corner" - the same technique Home's Problem section uses, applied to
  this page's own, more literal copy.
*/
function ScatteredTools() {
  // Offsets are tuned so same-row/same-column neighbors clear each other's
  // rendered width - the previous, smaller offsets put chip centers closer
  // together than the pills' own widths, so "Spreadsheet" and "Messages"
  // (the two longest labels) physically overlapped "Note app" and "Browser
  // tabs" and clipped their text. Larger, responsive offsets (bigger still
  // at sm+, where there's more room) keep every label fully legible.
  const tools: { icon: LucideIcon; label: string; offset: string }[] = [
    {
      icon: NotebookPen,
      label: "Note app",
      offset: "-rotate-6 -translate-x-16 -translate-y-10 sm:-translate-x-24 sm:-translate-y-12",
    },
    {
      icon: Table2,
      label: "Spreadsheet",
      offset: "rotate-4 translate-x-16 -translate-y-12 sm:translate-x-24 sm:-translate-y-14",
    },
    {
      icon: AppWindow,
      label: "Browser tabs",
      offset: "rotate-3 -translate-x-16 translate-y-10 sm:-translate-x-24 sm:translate-y-12",
    },
    {
      icon: MessageSquare,
      label: "Messages",
      offset: "-rotate-4 translate-x-16 translate-y-12 sm:translate-x-24 sm:translate-y-14",
    },
  ];

  return (
    <div
      aria-hidden="true"
      className="grid h-72 w-full place-items-center sm:h-80"
    >
      {tools.map((tool) => (
        <div
          key={tool.label}
          className={`[grid-area:1/1] flex items-center gap-2 rounded-xl border border-line-subtle bg-surface px-3.5 py-2.5 shadow-sm ${tool.offset}`}
        >
          <Icon icon={tool.icon} size="sm" className="shrink-0 text-ink-faint" />
          <span className="whitespace-nowrap text-caption font-medium text-ink-muted">
            {tool.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ScatteredPlanningProblem() {
  return (
    <Section background="surface-muted">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <Heading as="h2" className="text-balance">
              Most planning doesn’t fail from lack of effort - it fails from lack of structure.
            </Heading>
            <div className="mt-6 flex flex-col gap-4">
              <Text size="body-lg" tone="muted">
                A plan starts in one note app, moves to a spreadsheet, spawns a dozen browser
                tabs, and ends up scattered across messages to yourself. Nothing is wrong with any
                single piece - the problem is that none of it lives anywhere together.
              </Text>
              <Text size="body-lg" tone="muted">
                Static documents don’t help much either. A template you fill in once doesn’t adapt
                as the plan changes, doesn’t show you what’s left, and doesn’t make it any easier
                to pick back up after a week away from it.
              </Text>
            </div>
          </div>

          <ScatteredTools />
        </div>
      </Container>
    </Section>
  );
}
