import { ArrowRight } from "lucide-react";

import { Badge, Button, Card, EmptyState, Heading, Link, Text } from "@/components/ui";
import type { LifeImportantItem } from "@/types/life-planner";

import { IMPORTANT_ITEM_CATEGORY_BADGE, IMPORTANT_ITEM_CATEGORY_LABEL, importantItemExcerpt } from "../information/_components/important-item-visuals";

interface RecentImportantItemsSectionProps {
  items: LifeImportantItem[];
}

/**
 * The dashboard's own compact "Important information" section (Life Planner
 * Prompt 4 Phase 3 §6) - the real system that replaces `FutureModulesSection`'s
 * last remaining placeholder tile (see that file's own comment history for
 * how every earlier placeholder was narrowed or removed in turn as its own
 * real section landed). Up to 3 recent, non-archived items
 * (`getRecentImportantItemsForCurrentUser`,
 * `@/lib/life-planner/life-important-items`), each with its own title/
 * category badge/excerpt, plus a "New item"/"View all" link pair - a
 * glanceable preview, not a second place to write or edit, the exact same
 * "preview, not editor" role `RecentJournalSection` plays one module over.
 * No interactivity needed here, so this stays a plain Server Component.
 */
export function RecentImportantItemsSection({ items }: RecentImportantItemsSectionProps) {
  return (
    <Card variant="standard" padding="lg" className="border-line-subtle/60">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h3" size="h4">
          Important information
        </Heading>
        <Link href="/app/life-planner/information" variant="nav" className="flex items-center gap-1 text-body-sm font-medium">
          View all
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          description="Save the plans, intentions, and reference details worth keeping close."
          className="mt-4 py-6"
        />
      ) : (
        <div className="mt-4 flex flex-col gap-3">
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

      <div className="mt-4">
        <Button href="/app/life-planner/information/new" variant="outline" size="sm">
          New item
        </Button>
      </div>
    </Card>
  );
}
