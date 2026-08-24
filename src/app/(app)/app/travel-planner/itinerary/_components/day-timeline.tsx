import { Text } from "@/components/ui";
import type { ActivityInput, ActivityMutationResult, DeleteActivityResult } from "@/lib/travel/activities";
import type { Activity } from "@/types/travel";

import { ActivityRow } from "./activity-row";

interface DayTimelineProps {
  activities: Activity[];
  onSaveActivity: (activityId: string, input: ActivityInput) => Promise<ActivityMutationResult>;
  onDeleteActivity: (activityId: string) => Promise<DeleteActivityResult>;
}

/**
 * One day's activities as an actual chronological timeline (Prompt 2 Phase
 * 3), not just a plain list - a connecting rail with a dot per timed
 * activity makes the sequence visually obvious at a glance (Phase 3 §4).
 * Already-sorted input (`getActivitiesForTripDayIds`'s own `order`) is
 * split here into `timed`/`untimed` rather than re-sorted - untimed
 * activities get their own "Anytime" group below the rail instead of being
 * threaded into a line that would visually claim a time-order they don't
 * have (Phase 3 §5: "handle activities without a specific time
 * gracefully").
 */
export function DayTimeline({ activities, onSaveActivity, onDeleteActivity }: DayTimelineProps) {
  const timed = activities.filter((activity) => activity.startTime);
  const untimed = activities.filter((activity) => !activity.startTime);

  return (
    <div className="flex flex-col gap-4">
      {timed.length > 0 && (
        <ol className="relative flex flex-col gap-3 border-l-2 border-line-subtle pl-5">
          {timed.map((activity) => (
            <li key={activity.id} className="relative">
              <span
                className="absolute top-3.5 -left-[1.6rem] size-2.5 rounded-full bg-brand ring-4 ring-surface"
                aria-hidden="true"
              />
              <ActivityRow activity={activity} onSave={onSaveActivity} onDelete={onDeleteActivity} />
            </li>
          ))}
        </ol>
      )}

      {untimed.length > 0 && (
        <div className="flex flex-col gap-2">
          {timed.length > 0 && (
            <Text size="body-sm" tone="faint" weight="medium">
              Anytime
            </Text>
          )}
          {/* A plain (unordered) list, not `<ol>` like the timed rail above
              - these activities carry no time, so there's no sequence to
              assert, just a group. List semantics either way (not a bare
              `<div>` per item) so assistive tech announces "N items". */}
          <ul className="flex flex-col gap-2">
            {untimed.map((activity) => (
              <li key={activity.id}>
                <ActivityRow activity={activity} onSave={onSaveActivity} onDelete={onDeleteActivity} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
