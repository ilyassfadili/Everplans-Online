import { Users } from "lucide-react";

import { Card, EmptyState } from "@/components/ui";
import type { HouseholdMember } from "@/types/home-planner";

import { MemberRow } from "./member-row";

interface MemberListProps {
  members: HouseholdMember[];
}

/** The household list itself - a plain list, no filters/summary counts (Phase 2: "keep the experience simple"), unlike the guest list's RSVP tracking. */
export function MemberList({ members }: MemberListProps) {
  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Add your household"
        description="Add the people (and pets) who are part of this home above."
        className="py-14"
      />
    );
  }

  return (
    <Card variant="standard" padding="lg">
      <ul className="flex flex-col divide-y divide-line-subtle">
        {members.map((member) => (
          <MemberRow key={member.id} member={member} />
        ))}
      </ul>
    </Card>
  );
}
