import { Star } from "lucide-react";

import { Button, Card, Text } from "@/components/ui";
import type { InventoryItem } from "@/types/home-planner";

import { PanelHeader } from "./panel-header";

interface ImportantItemsSummaryCardProps {
  items: InventoryItem[];
}

/**
 * A small, lightweight Important Items summary for the Home Dashboard
 * (Prompt 2 Phase 3: "add a small Home Dashboard summary for important
 * items... keep it lightweight"). Same shape as `HouseholdSummaryCard`/
 * `ContactsSummaryCard` - a count and a link to the full view, not a
 * redesign of the dashboard.
 */
export function ImportantItemsSummaryCard({ items }: ImportantItemsSummaryCardProps) {
  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader
        icon={Star}
        title="Important Items"
        action={
          <Button href="/app/home-planner/important-items" variant="ghost" size="sm">
            View
          </Button>
        }
      />
      <div className="mt-4 flex-1">
        {items.length === 0 ? (
          <Text size="body-sm" tone="faint">
            Nothing marked important yet.
          </Text>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {items.slice(0, 4).map((item) => (
              <li key={item.id}>
                <Text size="body-sm" className="truncate text-ink">
                  {item.name}
                </Text>
              </li>
            ))}
          </ul>
        )}
        {items.length > 4 && (
          <Text size="body-sm" tone="faint" className="mt-2.5">
            +{items.length - 4} more
          </Text>
        )}
      </div>
    </Card>
  );
}
