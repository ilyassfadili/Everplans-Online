"use client";

import { useActionState, useState } from "react";
import { NotebookText, Trash2 } from "lucide-react";

import { Alert, Badge, Button, Card, EmptyState, Heading, Icon, Label, Select, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import type { ResolvedRelatedEntity } from "@/lib/wedding/related-entity";
import type { WeddingNote } from "@/types/wedding";

import { createNoteFormAction, removeNoteAction, type CreateNoteFormState } from "../actions";

const initialState: CreateNoteFormState = { status: "idle" };

interface NotesSectionProps {
  weddingId: string;
  notes: WeddingNote[];
  relatedEntityOptions: { value: string; label: string }[];
  /** Each note's resolved related-entity label, keyed by note id - computed server-side (`NotesPage`) via `resolveRelatedEntity`, never a function prop (a Client Component can't receive one from a Server Component). */
  relatedById: Record<string, ResolvedRelatedEntity | null>;
}

/** Notes (Prompt 5 Phase 3) - a lightweight, chronological list. Editing isn't offered here - a note's own content can just be deleted and re-added, keeping this feature genuinely lightweight rather than a document editor. */
export function NotesSection({ weddingId, notes, relatedEntityOptions, relatedById }: NotesSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const createAction = createNoteFormAction.bind(null, weddingId);
  const [formState, formAction, isCreating] = useActionState(createAction, initialState);

  function handleDelete(note: WeddingNote) {
    if (window.confirm(`Remove "${note.title}"?`)) {
      void removeNoteAction(note.id);
    }
  }

  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h2" size="h4">
          Notes
        </Heading>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            Add note
          </Button>
        )}
      </div>

      {notes.length === 0 && !isAdding && (
        <EmptyState icon={NotebookText} title="Capture the little things" description="Jot down anything worth remembering." className="mt-4 py-10" />
      )}

      {notes.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
          {notes.map((note) => {
            const related = relatedById[note.id] ?? null;
            return (
              <li key={note.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Text size="body" weight="medium" className="text-ink">
                      {note.title}
                    </Text>
                    {related && <Badge variant="neutral">{related.label}</Badge>}
                  </div>
                  {note.content && (
                    <Text size="body-sm" tone="muted" className="mt-1 whitespace-pre-wrap">
                      {note.content}
                    </Text>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(note)}
                  aria-label={`Remove "${note.title}"`}
                  className="-m-1.5 shrink-0 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  <Icon icon={Trash2} size="sm" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {isAdding && (
        <form action={formAction} className="mt-4 flex flex-col gap-3 border-t border-line-subtle pt-4">
          {formState.status !== "idle" && (
            <Alert variant="error" title="Couldn’t add that note">
              {formState.message}
            </Alert>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-note-title">Title</Label>
            <Input id="new-note-title" name="title" maxLength={150} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-note-content">
              Content <span className="font-normal text-ink-faint">(optional)</span>
            </Label>
            <Textarea id="new-note-content" name="content" rows={3} maxLength={5000} />
          </div>
          {relatedEntityOptions.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-note-related">
                Relates to <span className="font-normal text-ink-faint">(optional)</span>
              </Label>
              <Select id="new-note-related" name="relatedEntity" placeholder="Nothing specific" options={relatedEntityOptions} />
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isCreating}>
              Add note
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
