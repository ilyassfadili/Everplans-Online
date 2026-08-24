import { NotebookPen } from "lucide-react";

import { Button, Card, Heading, Icon, Text } from "@/components/ui";

interface ImportantNotesCardProps {
  notes: string | null;
}

/** "Important trip information" (Phase 3 §2) - read directly from `trips.notes` (Prompt 1), never a second notes field (Phase 3 §4/§5: "reuse existing trip information, no duplicate source of truth"). Editing happens on the Edit Trip screen, same as every other trip-setup field. */
export function ImportantNotesCard({ notes }: ImportantNotesCardProps) {
  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center gap-2.5">
        <Icon icon={NotebookPen} size="sm" className="text-ink-faint" />
        <Heading as="h2" size="h4">
          Important Notes
        </Heading>
      </div>
      {notes ? (
        <Text size="body-sm" tone="muted" className="mt-2 whitespace-pre-wrap">
          {notes}
        </Text>
      ) : (
        <Text size="body-sm" tone="muted" className="mt-2">
          Nothing added yet.
        </Text>
      )}
      <Button href="/app/travel-planner/edit" variant="ghost" size="sm" className="mt-3">
        Edit notes
      </Button>
    </Card>
  );
}
