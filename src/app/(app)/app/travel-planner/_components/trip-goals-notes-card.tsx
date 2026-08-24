import { NotebookPen } from "lucide-react";

import { Button, Card, EmptyState, Text } from "@/components/ui";

import { PanelHeader } from "./panel-header";

interface TripGoalsNotesCardProps {
  tripGoals: string | null;
  notes: string | null;
}

/**
 * Shows the trip's goals and notes if the traveler has added any yet, or a
 * calm empty state pointing at `/app/travel-planner/edit` if not - the same
 * "honest empty state, not a gap to fill with fake content" rule every
 * other dashboard panel in this codebase follows.
 */
export function TripGoalsNotesCard({ tripGoals, notes }: TripGoalsNotesCardProps) {
  if (!tripGoals && !notes) {
    return (
      <Card variant="standard" padding="lg" className="flex h-full flex-col">
        <PanelHeader icon={NotebookPen} title="Goals & Notes" />
        <EmptyState
          className="mt-4 border-none bg-transparent px-0 py-6"
          title="Nothing added yet"
          description="Add what you want out of this trip, or anything else worth keeping in mind."
          action={
            <Button href="/app/travel-planner/edit" variant="secondary" size="sm">
              Add goals or notes
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader icon={NotebookPen} title="Goals & Notes" />
      <div className="mt-3 flex flex-1 flex-col gap-4">
        {tripGoals && (
          <div>
            <Text size="body-sm" weight="medium" className="text-ink">
              Trip goals
            </Text>
            <Text size="body-sm" tone="muted" className="mt-1 whitespace-pre-wrap">
              {tripGoals}
            </Text>
          </div>
        )}
        {notes && (
          <div>
            <Text size="body-sm" weight="medium" className="text-ink">
              Notes
            </Text>
            <Text size="body-sm" tone="muted" className="mt-1 whitespace-pre-wrap">
              {notes}
            </Text>
          </div>
        )}
      </div>
    </Card>
  );
}
