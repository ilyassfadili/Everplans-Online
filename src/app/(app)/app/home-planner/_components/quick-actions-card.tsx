import { Contact, Pencil, UserPlus } from "lucide-react";

import { Card, Icon, Link, Text } from "@/components/ui";

import { PanelHeader } from "./panel-header";

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: typeof Pencil;
}

// Only actions this Prompt actually implements (Phase 3: "provide only
// actions that are actually supported by the current implementation") -
// edit the home profile, add a household member, add a contact. No links
// to rooms/inventory/maintenance/bills, which don't exist yet.
const QUICK_ACTIONS: QuickAction[] = [
  { label: "Edit home details", description: "Update your home profile", href: "/app/home-planner/edit", icon: Pencil },
  { label: "Add household member", description: "Add someone to your household", href: "/app/home-planner/household", icon: UserPlus },
  { label: "Add a contact", description: "Add a landlord, contractor, or emergency contact", href: "/app/home-planner/contacts", icon: Contact },
];

/**
 * Quick actions - a small, high-value set of shortcuts into the Home
 * Planner functionality that already exists (Phase 3: "do not create
 * buttons that lead to unimplemented future functionality"). Grows one
 * real action at a time alongside future prompts (rooms, maintenance,
 * bills, ...), the same rule `getUserPlannerWorkspaces`'s own `navItems`
 * follows.
 */
export function QuickActionsCard() {
  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader icon={Pencil} title="Quick Actions" />
      <ul className="mt-4 flex flex-1 flex-col gap-1">
        {QUICK_ACTIONS.map((action) => (
          <li key={action.href}>
            <Link
              href={action.href}
              className="flex items-center gap-3 rounded-md px-2 py-2.5 text-ink no-underline transition-colors duration-150 ease-standard hover:bg-surface-muted"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-brand">
                <Icon icon={action.icon} size="sm" />
              </span>
              <span className="min-w-0">
                <Text size="body-sm" weight="medium" className="text-ink">
                  {action.label}
                </Text>
                <Text size="body-sm" tone="faint">
                  {action.description}
                </Text>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
