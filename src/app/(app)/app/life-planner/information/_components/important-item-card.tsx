import { Badge, Card, Link, Text } from "@/components/ui";
import type { LifeImportantItem } from "@/types/life-planner";

import { IMPORTANT_ITEM_CATEGORY_BADGE, IMPORTANT_ITEM_CATEGORY_LABEL, importantItemExcerpt } from "./important-item-visuals";

interface ImportantItemCardProps {
  item: LifeImportantItem;
  /** `null` when the item isn't filed under an area, or when its area was since removed (`life_area_id` sets `null` on delete). */
  areaName: string | null;
  /** `null` when the item isn't linked to a goal, or when its goal was since removed. */
  goalTitle: string | null;
}

/**
 * One Important Item's own card for the list grid (Life Planner Prompt 4
 * Phase 3) - deliberately styled closer to `GoalCard` than to Journal's own
 * `JournalEntryCard`: this is reference material a user comes back to look
 * up, not prose to read start to finish, so it earns the same compact
 * `Card variant="interactive"` grid treatment every other browsable Life
 * Planner list (Goals, Areas) already uses rather than the Journal's
 * spacious, full-width notebook-page rows. The category `Badge` is the
 * card's one visual anchor - a quick "what kind of thing is this" signal
 * before the title/excerpt, the same role `STATUS_BADGE` plays on
 * `GoalCard`.
 */
export function ImportantItemCard({ item, areaName, goalTitle }: ImportantItemCardProps) {
  return (
    <Link href={`/app/life-planner/information/${item.id}`} variant="inline" className="block text-ink no-underline hover:text-ink">
      <Card variant="interactive" padding="lg" className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <Badge variant={IMPORTANT_ITEM_CATEGORY_BADGE[item.category]}>{IMPORTANT_ITEM_CATEGORY_LABEL[item.category]}</Badge>
          {item.isArchived && <Badge variant="neutral">Archived</Badge>}
        </div>

        <Text as="p" weight="semibold" className="line-clamp-2 text-ink">
          {item.title}
        </Text>

        <Text size="body-sm" tone="muted" className="line-clamp-3">
          {importantItemExcerpt(item.content)}
        </Text>

        {(areaName || goalTitle) && (
          <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line-subtle/60 pt-3">
            {areaName && <Badge variant="outline">{areaName}</Badge>}
            {goalTitle && <Badge variant="outline">{goalTitle}</Badge>}
          </div>
        )}
      </Card>
    </Link>
  );
}
