import { ArrowRight, Lock, NotebookPen } from "lucide-react";
import Image from "next/image";

import { Badge, buttonVariants, Card, CardDescription, CardHeader, CardTitle, Icon, Link } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format-price";
import type { Planner } from "@/types/planner";

interface PlannerCardProps {
  planner: Planner;
}

/**
 * The reusable presentation for one planner in a catalog grid, built
 * against the `Planner` contract - the same contract `getPublishedPlanners()`
 * (`@/lib/planner-catalog`) hands real data through, `isFree`/`priceCents`
 * included. A paid planner shows a lock + its real price; a free one shows
 * a plain "Free" badge - Everplans is a platform where planners are chosen
 * and purchased individually, never presented as though everything on it
 * is automatically free.
 *
 * Centered, card-shaped content (same visual language the authenticated
 * app's `StoreProductCard` already established) rather than left-aligned
 * text - badges, title, and description all sit on one central axis, and
 * "Learn more" reads as a real, full-width button rather than a plain text
 * link, so the card looks like a considered product tile instead of a
 * scaled-down list row. The whole card is still one click target (`Link`
 * wraps everything) - "Learn more" is a `<span>` styled with the shared
 * `buttonVariants` classes, not a real nested `<Button>`, since an anchor
 * inside this card's own outer anchor would be invalid HTML.
 *
 * Links to `planner.href` when the catalog supplied one - a hand-built
 * product's real Product Landing Page (`/products/${slug}`) - falling back
 * to `/planners/${slug}` for a future generic-catalog planner with no
 * landing page of its own yet (see `Planner.href`'s own comment). Copy is
 * "Learn more," not "Open planner" - this is the public, signed-out
 * catalog; actually opening a planner always requires an account (and, for
 * a paid one, purchasing it), so the honest destination from here is the
 * page that explains the product, not a promise this card alone can't keep.
 *
 * The visual slot renders a generic mark rather than a photo or mockup -
 * there is no real planner artwork yet, and a repeated stock-looking
 * placeholder image reads as more dishonest than an honest icon does.
 */
export function PlannerCard({ planner }: PlannerCardProps) {
  return (
    <Link href={planner.href ?? `/planners/${planner.slug}`} className="group block h-full no-underline">
      <Card variant="interactive" padding="none" className="flex h-full flex-col overflow-hidden rounded-xl">
        <div className="relative aspect-[4/3] overflow-hidden border-b border-line-subtle bg-surface-muted">
          {planner.imageUrl ? (
            <Image
              src={planner.imageUrl}
              alt={planner.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 ease-standard group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <NotebookPen className="size-8 text-ink-disabled" strokeWidth={1.5} aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col items-center gap-2.5 p-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="brand">{planner.categoryName}</Badge>
            {planner.isFree ? (
              <Badge variant="success">Free</Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Icon icon={Lock} size="sm" className="text-ink-faint" />
                {planner.priceCents !== null ? formatPrice(planner.priceCents) : "Paid"}
              </Badge>
            )}
          </div>
          <CardHeader className="items-center gap-1">
            <CardTitle>{planner.title}</CardTitle>
            <CardDescription className="line-clamp-2">{planner.description}</CardDescription>
          </CardHeader>
          <span className={cn(buttonVariants({ variant: "primary", size: "sm" }), "mt-auto w-full")}>
            Learn more
            <span className="inline-flex transition-transform duration-150 ease-standard group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0">
              <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </span>
          </span>
        </div>
      </Card>
    </Link>
  );
}
