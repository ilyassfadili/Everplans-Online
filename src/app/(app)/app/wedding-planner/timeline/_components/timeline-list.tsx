"use client";

import { CalendarHeart } from "lucide-react";

import { EmptyState } from "@/components/ui";
import type { TimelineEntry } from "@/types/wedding";

import { editImportantDateAction, editWeddingDateAction, removeImportantDateAction } from "../actions";
import { TimelineEntryRow } from "./timeline-entry-row";

interface TimelineListProps {
  weddingId: string;
  entries: TimelineEntry[];
}

function handleDelete(id: string, title: string) {
  if (window.confirm(`Remove "${title}" from your timeline?`)) {
    void removeImportantDateAction(id);
  }
}

/** The timeline's own chronological list - already sorted (`@/lib/wedding/timeline`'s `buildTimeline`), just rendered here. */
export function TimelineList({ weddingId, entries }: TimelineListProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={CalendarHeart}
        title="Mark the moments that matter"
        description="Add a date above - things like your engagement party, a venue tour, or when invitations go out."
        className="py-14"
      />
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-line-subtle">
      {entries.map((entry) => (
        <TimelineEntryRow
          key={entry.id}
          entry={entry}
          onSave={editImportantDateAction}
          onSaveWeddingDate={entry.kind === "wedding-date" ? (date) => editWeddingDateAction(weddingId, date) : undefined}
          onDelete={(id) => handleDelete(id, entry.title)}
        />
      ))}
    </ul>
  );
}
