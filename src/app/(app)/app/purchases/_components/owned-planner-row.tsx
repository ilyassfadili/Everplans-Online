import { ArrowRight } from "lucide-react";

import { Badge, buttonVariants, Card, Heading, Icon, Link, Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { StoreListing } from "@/types/store";

interface OwnedPlannerRowProps {
  listing: StoreListing;
}

/**
 * One planner the current user has access to but has no matching row in
 * `orders` for - a legacy/direct-ownership case (Wedding Planner's own
 * `weddings` table, Budget Planner's own `budget_plans` table, both
 * resolved by `getOwnedPlanners()`, `@/lib/owned-planners`) that predates
 * the real checkout/`orders` system, or any other path that grants access
 * without a formal purchase record. Visually a sibling of `OrderRow` (same
 * card-row shape) but honest about the difference: "Included" instead of a
 * status/price, and no order reference to link to, since none exists.
 *
 * Same icon-tile + real-button treatment `StoreProductCard` uses, so a
 * planner looks like the same considered product here as it does in the
 * Store and My Planners, rather than a plain text row. The CTA is a `<span>`
 * styled with `buttonVariants` rather than a nested `<Button>` - the whole
 * row is one click target already wrapped in an outer `Link`, and an anchor
 * inside an anchor is invalid HTML.
 */
export function OwnedPlannerRow({ listing }: OwnedPlannerRowProps) {
  return (
    <Link href={listing.href} className="group block no-underline">
      <Card
        variant="interactive"
        padding="md"
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-brand">
            <Icon icon={listing.icon} size="md" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Heading as="h3" size="h4" className="truncate">
                {listing.title}
              </Heading>
              <Badge variant="success">Included</Badge>
            </div>
            <Text size="body-sm" tone="muted">
              {listing.categoryLabel} · No purchase record on file for this one
            </Text>
          </div>
        </div>

        <span className={cn(buttonVariants({ variant: "primary", size: "sm" }), "w-full shrink-0 sm:w-auto")}>
          Open planner
          <span className="inline-flex transition-transform duration-150 ease-standard group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0">
            <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </span>
        </span>
      </Card>
    </Link>
  );
}
