"use client";

import { useActionState, useState, useTransition } from "react";
import { GitBranch, Trash2 } from "lucide-react";

import { Alert, Badge, Button, Card, EmptyState, Heading, Icon, Label, Select, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import type { ResolvedRelatedEntity } from "@/lib/wedding/related-entity";
import type { WeddingDecision } from "@/types/wedding";

import { createDecisionFormAction, removeDecisionAction, toggleDecisionStatusAction, type CreateDecisionFormState } from "../actions";

const initialState: CreateDecisionFormState = { status: "idle" };

interface DecisionsSectionProps {
  weddingId: string;
  decisions: WeddingDecision[];
  relatedEntityOptions: { value: string; label: string }[];
  /** Each decision's resolved related-entity label, keyed by decision id - see `NotesSectionProps.relatedById`'s own comment for why this is data, not a function prop. */
  relatedById: Record<string, ResolvedRelatedEntity | null>;
}

/** Decisions (Prompt 5 Phase 3) - a lightweight record of an important choice, not a corporate workflow. Status is a single click, not a form. */
export function DecisionsSection({ weddingId, decisions, relatedEntityOptions, relatedById }: DecisionsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [, startStatusTransition] = useTransition();
  const createAction = createDecisionFormAction.bind(null, weddingId);
  const [formState, formAction, isCreating] = useActionState(createAction, initialState);

  function handleToggleStatus(decision: WeddingDecision) {
    startStatusTransition(() => {
      void toggleDecisionStatusAction(decision.id, decision.status === "open" ? "decided" : "open");
    });
  }

  function handleDelete(decision: WeddingDecision) {
    if (window.confirm(`Remove "${decision.title}"?`)) {
      void removeDecisionAction(decision.id);
    }
  }

  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h2" size="h4">
          Decisions
        </Heading>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            Add decision
          </Button>
        )}
      </div>

      {decisions.length === 0 && !isAdding && (
        <EmptyState icon={GitBranch} title="Keep track of what you've decided" description="Track important choices you've made along the way." className="mt-4 py-10" />
      )}

      {decisions.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
          {decisions.map((decision) => {
            const related = relatedById[decision.id] ?? null;
            return (
              <li key={decision.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Text size="body" weight="medium" className="text-ink">
                      {decision.title}
                    </Text>
                    {related && <Badge variant="neutral">{related.label}</Badge>}
                  </div>
                  {decision.description && (
                    <Text size="body-sm" tone="muted" className="mt-1">
                      {decision.description}
                    </Text>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={() => handleToggleStatus(decision)} aria-label={`Mark decision as ${decision.status === "open" ? "decided" : "open"}`}>
                    <Badge variant={decision.status === "decided" ? "success" : "outline"}>{decision.status === "decided" ? "Decided" : "Open"}</Badge>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(decision)}
                    aria-label={`Remove "${decision.title}"`}
                    className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    <Icon icon={Trash2} size="sm" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isAdding && (
        <form action={formAction} className="mt-4 flex flex-col gap-3 border-t border-line-subtle pt-4">
          {formState.status !== "idle" && (
            <Alert variant="error" title="Couldn’t add that decision">
              {formState.message}
            </Alert>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-decision-title">Title</Label>
            <Input id="new-decision-title" name="title" maxLength={150} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-decision-description">
              Context <span className="font-normal text-ink-faint">(optional)</span>
            </Label>
            <Textarea id="new-decision-description" name="description" rows={2} maxLength={2000} />
          </div>
          {relatedEntityOptions.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-decision-related">
                Relates to <span className="font-normal text-ink-faint">(optional)</span>
              </Label>
              <Select id="new-decision-related" name="relatedEntity" placeholder="Nothing specific" options={relatedEntityOptions} />
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={isCreating}>
              Add decision
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
