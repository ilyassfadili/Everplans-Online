import { Contact } from "lucide-react";

import { Card, EmptyState } from "@/components/ui";
import type { HomeContact } from "@/types/home-planner";

import { ContactRow } from "./contact-row";

interface ContactListProps {
  contacts: HomeContact[];
}

/** The important contacts list itself - a plain list, the same shape `MemberList` (Household) establishes. */
export function ContactList({ contacts }: ContactListProps) {
  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={Contact}
        title="Add your important contacts"
        description="Add your landlord, property manager, contractor, or emergency contact above."
        className="py-14"
      />
    );
  }

  return (
    <Card variant="standard" padding="lg">
      <ul className="flex flex-col divide-y divide-line-subtle">
        {contacts.map((contact) => (
          <ContactRow key={contact.id} contact={contact} />
        ))}
      </ul>
    </Card>
  );
}
