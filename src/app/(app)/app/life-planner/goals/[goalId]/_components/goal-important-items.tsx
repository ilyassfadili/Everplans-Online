import { Badge, Link, Text } from "@/components/ui";
import type { LifeImportantItem } from "@/types/life-planner";

import { IMPORTANT_ITEM_CATEGORY_BADGE, IMPORTANT_ITEM_CATEGORY_LABEL, importantItemExcerpt } from "../../../information/_components/important-item-visuals";

interface GoalImportantItemsProps {
  goalId: string;
  items: LifeImportantItem[];
}

/**
 * The goal detail page's own compact "Important information" section (Life
 * Planner Prompt 4 Phase 3 §5) - every non-archived Important Item linked to
 * this goal (`getImportantItemsForCurrentUser({ goalId })`,
 * `@/lib/life-planner/life-important-items`), newest first. A plain list of
 * title/category/excerpt rows linking out to each item's own detail page,
 * deliberately not an inline editor - the exact same "link out to the real
 * detail page rather than edit inline" role `GoalJournalReflections`
 * (`./goal-journal-reflections.tsx`) already plays one section up, mirrored
 * here field-for-field so the two sections read as one consistent pattern.
 * "Add" pre-fills this goal via `?goalId=`, read back by the composer
 * (`NewImportantItemForm`'s own `defaultGoalId` prop) so an item started
 * from a goal's page doesn't require re-picking it.
 */
export function GoalImportantItems({ goalId, items }: GoalImportantItemsProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <Text size="body-sm" tone="muted">
          No important items linked to this goal yet.
        </Text>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/app/life-planner/information/${item.id}`}
              variant="inline"
              className="block rounded-lg border border-line-subtle/60 bg-surface p-4 no-underline transition-colors duration-200 ease-standard hover:bg-surface-muted/40"
            >
              <div className="flex items-baseline justify-between gap-3">
                <Text size="body-sm" weight="medium" className="truncate text-ink">
                  {item.title}
                </Text>
                <Badge variant={IMPORTANT_ITEM_CATEGORY_BADGE[item.category]} className="shrink-0">
                  {IMPORTANT_ITEM_CATEGORY_LABEL[item.category]}
                </Badge>
              </div>
              <Text size="body-sm" tone="muted" className="mt-1">
                {importantItemExcerpt(item.content)}
              </Text>
            </Link>
          ))}
        </div>
      )}

      <Link href={`/app/life-planner/information/new?goalId=${goalId}`} variant="subtle" className="self-start text-body-sm">
        Add important information →
      </Link>
    </div>
  );
}
