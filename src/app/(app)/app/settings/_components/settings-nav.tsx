import { Card } from "@/components/ui";

interface SettingsSection {
  id: string;
  label: string;
}

interface SettingsNavProps {
  sections: readonly SettingsSection[];
}

/**
 * Desktop's "LEFT: compact settings index" (Settings §12) - plain anchor
 * links into the same single-page section stack every viewport renders,
 * not a client-routed tab switcher. Four sections is too few to justify
 * the complexity (and failure surface) of scroll-driven active-section
 * tracking, so this stays native: no JavaScript, no ARIA beyond what a
 * `<nav>` of real `<a href="#...">` links already provides for free.
 *
 * Wrapped in the same `Card` every section to its right uses (live
 * feedback: the rail read as bare, unbounded text floating beside a
 * column of bordered cards) - `padding="sm"` rather than the sections'
 * own `lg`, since this card holds a tight link list, not prose/form
 * content. `divide-y` between the items (live feedback: a thin line
 * between each) rather than a border on the card's own children
 * individually - one utility on the list, not four near-duplicate
 * `border-t`s on each `<li>`.
 *
 * `hidden lg:block`: below `lg` there's no side rail at all - Settings
 * §14/§15 both ask for tablet/mobile to be "intentionally designed," not
 * a shrunk two-column desktop layout, and the sections themselves (each
 * with its own `<h2>`) are already a complete, navigable stacked layout
 * without this rail's help. `sticky top-20` clears `DashboardTopbar`'s
 * `h-16` with a little breathing room, mirroring each section's own
 * `scroll-mt-24` (`page.tsx`) so a followed link lands with the same
 * clearance either way.
 */
export function SettingsNav({ sections }: SettingsNavProps) {
  return (
    <Card
      as="nav"
      aria-label="Settings sections"
      variant="standard"
      padding="sm"
      className="hidden lg:sticky lg:top-20 lg:block"
    >
      <ul className="flex flex-col gap-1 divide-y divide-line-subtle">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="block rounded-md px-3 py-2 text-body-sm font-medium text-ink-muted transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
