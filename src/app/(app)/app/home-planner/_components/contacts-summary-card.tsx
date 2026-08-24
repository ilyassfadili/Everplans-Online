import { Contact } from "lucide-react";

import { Badge, Button, Card, Text } from "@/components/ui";
import { getHomeContactRoleLabel } from "@/components/home-planner/home-contact-role-options";
import type { HomeContact } from "@/types/home-planner";

import { PanelHeader } from "./panel-header";

interface ContactsSummaryCardProps {
  contacts: HomeContact[];
}

/** The important contacts summary - a small preview of who's on hand, with a link to the full management page (Phase 2's `/app/home-planner/contacts`). */
export function ContactsSummaryCard({ contacts }: ContactsSummaryCardProps) {
  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader
        icon={Contact}
        title="Important Contacts"
        action={
          <Button href="/app/home-planner/contacts" variant="ghost" size="sm">
            Manage
          </Button>
        }
      />
      <div className="mt-4 flex-1">
        {contacts.length === 0 ? (
          <Text size="body-sm" tone="faint">
            No important contacts added yet.
          </Text>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {contacts.slice(0, 4).map((contact) => (
              <li key={contact.id} className="flex items-center justify-between gap-2">
                <Text size="body-sm" className="truncate text-ink">
                  {contact.name}
                </Text>
                <Badge variant="neutral">{getHomeContactRoleLabel(contact.role)}</Badge>
              </li>
            ))}
          </ul>
        )}
        {contacts.length > 4 && (
          <Text size="body-sm" tone="faint" className="mt-2.5">
            +{contacts.length - 4} more
          </Text>
        )}
      </div>
    </Card>
  );
}
