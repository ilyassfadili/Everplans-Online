import { ArrowRight, CheckCircle2, Lock } from "lucide-react";
import Image from "next/image";

import { Badge, buttonVariants, Card, CardDescription, CardFooter, CardHeader, CardTitle, Icon, Link, Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format-price";
import type { PlannerAccessState, StoreListing } from "@/types/store";

interface StoreProductCardProps {
  listing: StoreListing;
}

const accessStateBadge: Record<PlannerAccessState, { label: string; variant: "brand" | "success" | "neutral" }> = {
  available: { label: "Available", variant: "brand" },
  "coming-soon": { label: "Coming Soon", variant: "neutral" },
  "already-owned": { label: "Already in your workspace", variant: "success" },
  unavailable: { label: "Unavailable", variant: "neutral" },
};

/**
 * One product in the Store's catalog - built around `StoreListing`
 * (`@/types/store`), the common shape both the generic catalog and real
 * hand-built products (the Wedding Planner) normalize into, rather than the
 * generic-only `PlannerDefinition`. See `StoreListing`'s own comment for why
 * a single card needs to render both without knowing which source a given
 * listing came from.
 *
 * `already-owned` swaps the CTA to `listing.ownedCtaLabel` and drops the
 * arrow for a checkmark (Phase 1 §12: "Already in your workspace" rather
 * than a purchase CTA) - no payment/entitlement logic lives in this
 * component, it only renders whatever `accessState` the listing was already
 * resolved with. The lock+price badge (`listing.isFree`/`priceCents`) is
 * suppressed once `already-owned` - a lock communicates "this requires
 * purchase," which stops being true the moment the workspace already
 * exists; showing a $29 lock next to "Already in your workspace" would
 * contradict the badge sitting right next to it. Not-yet-owned paid
 * planners still show the same real price the public catalog card
 * (`PlannerCard`) and the Product Landing Page's own pricing section show,
 * never a second, independently-typed number.
 *
 * The whole card is one click target, same pattern the public `PlannerCard`
 * already uses - not just the CTA at the bottom. That means the CTA itself
 * can't be a real nested `<Button>`/`<Link>` (an anchor inside the card's
 * own outer anchor is invalid HTML and a hydration risk); it's a plain
 * `<span>` styled via the exact same `buttonVariants` classes `Button`
 * renders with, so it looks identical while the outer `Link` does the
 * actual navigating.
 */
export function StoreProductCard({ listing }: StoreProductCardProps) {
  const badge = accessStateBadge[listing.accessState];
  const isOwned = listing.accessState === "already-owned";
  const isActionable = listing.accessState === "available" || listing.accessState === "already-owned";
  // `already-owned` skips straight into the app; `available` goes to the
  // product's landing page first when one exists (falls back to `href` for
  // a listing with no landing page yet, e.g. the still-empty generic catalog).
  const href = isOwned ? listing.href : (listing.availableHref ?? listing.href);

  const card = (
    <Card
      variant="interactive"
      padding="none"
      className="flex h-full flex-col overflow-hidden rounded-xl"
    >
      <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-accent-subtle to-surface-muted">
        {listing.imageUrl ? (
          <Image
            src={listing.imageUrl}
            alt={listing.title}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 ease-standard group-hover:scale-105"
          />
        ) : (
          <div className="flex size-14 items-center justify-center rounded-full bg-surface text-brand shadow-sm ring-1 ring-line-subtle">
            <Icon icon={listing.icon} size="lg" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col items-center gap-2.5 p-5 text-center">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <Badge variant="brand">{listing.categoryLabel}</Badge>
          {!isOwned &&
            (listing.isFree ? (
              <Badge variant="success">Free</Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Icon icon={Lock} size="sm" className="text-ink-faint" />
                {listing.priceCents !== null ? formatPrice(listing.priceCents) : "Paid"}
              </Badge>
            ))}
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
        <CardHeader className="items-center gap-1">
          <CardTitle>{listing.title}</CardTitle>
          <CardDescription className="line-clamp-2">{listing.description}</CardDescription>
        </CardHeader>
        <CardFooter className="mt-auto w-full pt-1">
          {isActionable ? (
            <span
              className={cn(buttonVariants({ variant: isOwned ? "secondary" : "primary", size: "sm" }), "w-full")}
            >
              {isOwned ? listing.ownedCtaLabel : listing.availableCtaLabel}
              <span className="inline-flex transition-transform duration-150 ease-standard group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0">
                <Icon icon={isOwned ? CheckCircle2 : ArrowRight} size="sm" />
              </span>
            </span>
          ) : (
            <Text size="body-sm" tone="faint">
              Not available right now
            </Text>
          )}
        </CardFooter>
      </div>
    </Card>
  );

  if (!isActionable) {
    return card;
  }

  return (
    <Link href={href} className="group block h-full no-underline">
      {card}
    </Link>
  );
}
