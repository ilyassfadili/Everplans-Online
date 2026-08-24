import { Users } from "lucide-react";

import { Badge, Button, Card, Text } from "@/components/ui";
import { getHouseholdRelationshipLabel } from "@/components/home-planner/household-relationship-options";
import type { HouseholdMember } from "@/types/home-planner";

import { PanelHeader } from "./panel-header";

interface HouseholdSummaryCardProps {
  members: HouseholdMember[];
}

/** The household summary - a small preview of who's part of the home, with a link to the full management page (Phase 2's `/app/home-planner/household`). */
export function HouseholdSummaryCard({ members }: HouseholdSummaryCardProps) {
  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader
        icon={Users}
        title="Household"
        action={
          <Button href="/app/home-planner/household" variant="ghost" size="sm">
            Manage
          </Button>
        }
      />
      <div className="mt-4 flex-1">
        {members.length === 0 ? (
          <Text size="body-sm" tone="faint">
            No household members added yet.
          </Text>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {members.slice(0, 4).map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-2">
                <Text size="body-sm" className="truncate text-ink">
                  {member.name}
                </Text>
                <Badge variant="neutral">{getHouseholdRelationshipLabel(member.relationship)}</Badge>
              </li>
            ))}
          </ul>
        )}
        {members.length > 4 && (
          <Text size="body-sm" tone="faint" className="mt-2.5">
            +{members.length - 4} more
          </Text>
        )}
      </div>
    </Card>
  );
}
