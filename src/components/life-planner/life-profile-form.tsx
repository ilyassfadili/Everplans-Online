"use client";

import { Compass, Pencil } from "lucide-react";
import { useActionState, useState } from "react";

import { updateLifeProfile, type UpdateLifeProfileFormState } from "@/app/(app)/app/life-planner/actions";
import { Alert, Button, Card, EmptyState, FormField, Heading, Stack, Text } from "@/components/ui";
import { Textarea } from "@/components/ui/form/textarea";
import type { LifePlan } from "@/types/life-planner";

const initialFormState: UpdateLifeProfileFormState = { status: "idle" };

type ProfileFieldKey =
  | "planningIdentity"
  | "currentPriorities"
  | "importantAreas"
  | "shortTermDirection"
  | "longTermDirection"
  | "planningPreferences";

interface FieldConfig {
  key: ProfileFieldKey;
  label: string;
  hint: string;
  placeholder: string;
}

// Warm, specific copy per field - this is a personal reflection, not a
// settings form, so labels ask a question rather than name a database
// column (Phase 2 scope §3).
const FIELD_CONFIG: readonly FieldConfig[] = [
  {
    key: "planningIdentity",
    label: "Who you are",
    hint: "A few words about your values, personality, or what shapes how you make decisions.",
    placeholder: "I'm the kind of person who...",
  },
  {
    key: "currentPriorities",
    label: "What matters to you right now?",
    hint: "Whatever's taking up your attention this season - specific or big-picture, whatever's true.",
    placeholder: "Right now I'm focused on...",
  },
  {
    key: "importantAreas",
    label: "Life areas that matter most",
    hint: "Health, career, relationships, finances, faith - name the ones you want to keep front of mind.",
    placeholder: "The areas I care most about are...",
  },
  {
    key: "shortTermDirection",
    label: "Where you're headed - short term",
    hint: "The next few months, in your own words.",
    placeholder: "Over the next few months I want to...",
  },
  {
    key: "longTermDirection",
    label: "Where you're headed - long term",
    hint: "The bigger picture, a few years out.",
    placeholder: "A few years from now I'd like to...",
  },
  {
    key: "planningPreferences",
    label: "How you like to plan",
    hint: "Structured lists, loose intentions, daily check-ins - tell your Life Planner how to work with you.",
    placeholder: "I plan best when...",
  },
] as const;

// View mode groups the same six fields under the section labels Phase 2
// asked for ("Who you are", "Right now", "Life areas that matter", "Where
// you're headed", "How you like to plan") - "Where you're headed" is the
// one section that shows two fields (short/long term) side by side.
const VIEW_SECTIONS: readonly { title: string; fields: readonly ProfileFieldKey[] }[] = [
  { title: "Who you are", fields: ["planningIdentity"] },
  { title: "Right now", fields: ["currentPriorities"] },
  { title: "Life areas that matter", fields: ["importantAreas"] },
  { title: "Where you're headed", fields: ["shortTermDirection", "longTermDirection"] },
  { title: "How you like to plan", fields: ["planningPreferences"] },
];

const VIEW_FIELD_LABEL: Record<ProfileFieldKey, string> = {
  planningIdentity: "Who you are",
  currentPriorities: "Right now",
  importantAreas: "Life areas that matter",
  shortTermDirection: "Short term",
  longTermDirection: "Long term",
  planningPreferences: "How you like to plan",
};

function hasAnyContent(plan: LifePlan): boolean {
  return FIELD_CONFIG.some((field) => Boolean(plan[field.key]));
}

const SUMMARY_LENGTH = 140;

/** Same "cut at a word boundary, trailing ellipsis" shape `journalExcerpt`/`importantItemExcerpt` use one product level up - kept local since this is the only place a Life Profile field itself needs truncating. */
function summarize(value: string): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (collapsed.length <= SUMMARY_LENGTH) return collapsed;
  const truncated = collapsed.slice(0, SUMMARY_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${(lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trimEnd()}…`;
}

interface LifeProfileSectionProps {
  plan: LifePlan;
  /**
   * Renders a one-line summary strip (with a "View full profile" toggle)
   * instead of the full two-column read view once the profile has content -
   * Phase 2's "don't re-display the whole profile every visit" polish. Has
   * no effect on the empty or editing states, which stay exactly as
   * prominent either way: an unfilled profile is still the one real
   * onboarding action worth its own full-size prompt, and the edit form
   * needs its full height regardless of how the read view collapses.
   * Defaults to `false` so any future caller gets today's always-expanded
   * behavior unless it opts in.
   */
  compact?: boolean;
}

/**
 * The Life Profile view/edit experience - a single client component that
 * owns the "empty prompt vs. read view vs. edit form" toggle in place, on
 * one page, rather than a separate `/edit` route (Phase 2 scope §3). Mirrors
 * `VendorDetailView`'s (`wedding-planner/vendors/[vendorId]`) inline-card
 * toggle pattern more than Travel Planner's dedicated edit route, since
 * there's no second screen worth navigating to for six text fields.
 *
 * Keeps its own `plan` state, seeded from the server-rendered prop and
 * replaced with whatever `updateLifeProfile` returns on a successful save -
 * `revalidatePath` (in the action) keeps the next full page load correct
 * too, but the in-place swap is what makes Save feel instant.
 */
export function LifeProfileSection({ plan: initialPlan, compact = false }: LifeProfileSectionProps) {
  const [plan, setPlan] = useState(initialPlan);
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [state, formAction, isPending] = useActionState(updateLifeProfile, initialFormState);

  // Adjusting state in response to a changed value, computed during render
  // rather than in an effect (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  // - `handledState` guards against re-running this on every render, only
  // firing the once when `useActionState` hands back a new result object.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.status === "success" && state.plan) {
      setPlan(state.plan);
      setIsEditing(false);
    }
  }

  if (isEditing) {
    return (
      <Card variant="standard" padding="lg">
        <form action={formAction} noValidate>
          <Stack gap="5">
            <div>
              <Heading as="h3" size="h3">
                Edit your Life Profile
              </Heading>
              <Text size="body-sm" tone="muted" className="mt-1">
                Write as much or as little as you&rsquo;d like - every field here is optional.
              </Text>
            </div>

            {(state.status === "error" || state.status === "invalid") && (
              <Alert variant="error" title="Couldn't save your changes">
                {state.message}
              </Alert>
            )}

            {FIELD_CONFIG.map((field) => (
              <FormField key={field.key} label={field.label} hint={field.hint}>
                <Textarea
                  name={field.key}
                  rows={3}
                  maxLength={2000}
                  placeholder={field.placeholder}
                  defaultValue={plan[field.key] ?? ""}
                />
              </FormField>
            ))}

            <div className="flex items-center gap-3">
              <Button type="submit" loading={isPending}>
                Save Life Profile
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={isPending}>
                Cancel
              </Button>
            </div>
          </Stack>
        </form>
      </Card>
    );
  }

  if (!hasAnyContent(plan)) {
    return (
      <EmptyState
        icon={Compass}
        title="Your Life Profile is empty"
        description="A few honest sentences about who you are and where you're headed help everything else in your Life Planner make more sense."
        action={
          <Button onClick={() => setIsEditing(true)}>Start your Life Profile</Button>
        }
        className="py-14"
      />
    );
  }

  // Compact summary strip: the one filled field most worth surfacing at a
  // glance, plus "View full profile" - collapsed by default so a returning
  // user's full six-field profile doesn't re-render every visit, the same
  // "preview, not the whole thing" role every other dashboard section here
  // already plays for its own data.
  if (compact && !isExpanded) {
    const summaryField = FIELD_CONFIG.find((field) => Boolean(plan[field.key]));
    const summaryText = summaryField ? summarize(plan[summaryField.key] as string) : null;

    return (
      <Card variant="standard" padding="md">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Text size="body-sm" weight="semibold" className="text-ink">
              Your Life Profile
            </Text>
            {summaryText && (
              <Text size="body-sm" tone="muted" className="mt-0.5 truncate">
                {summaryText}
              </Text>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setIsExpanded(true)}>
              View full profile
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="size-4" aria-hidden="true" />
              Edit
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="standard" padding="lg">
      <Stack gap="6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Heading as="h3" size="h3">
              Your Life Profile
            </Heading>
            <Text size="body-sm" tone="muted" className="mt-1">
              The context your Life Planner uses to feel like it&rsquo;s actually yours.
            </Text>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {compact && (
              <Button size="sm" variant="ghost" onClick={() => setIsExpanded(false)}>
                Show less
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="size-4" aria-hidden="true" />
              Edit
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {VIEW_SECTIONS.map((section) => {
            const filledFields = section.fields.filter((key) => Boolean(plan[key]));
            if (filledFields.length === 0) {
              return null;
            }

            return (
              <div key={section.title} className="flex flex-col gap-3 rounded-md border border-line-subtle bg-surface-muted/40 p-4">
                <Text size="label" weight="semibold" tone="muted" className="uppercase tracking-[0.06em]">
                  {section.title}
                </Text>
                <div className="flex flex-col gap-4">
                  {filledFields.map((key) => (
                    <div key={key}>
                      {section.fields.length > 1 && (
                        <Text size="body-sm" weight="medium" tone="faint" className="mb-1">
                          {VIEW_FIELD_LABEL[key]}
                        </Text>
                      )}
                      <Text size="body" className="whitespace-pre-wrap">
                        {plan[key]}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Stack>
    </Card>
  );
}
